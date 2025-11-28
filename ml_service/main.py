"""
Grocify ML Service: AI Recipe Generation via FastAPI

This service exposes a single endpoint that accepts a list of ingredients
and returns AI-generated recipes using a Hugging Face T5 text2text model.

Requirements (inside venv):
  pip install fastapi uvicorn torch transformers

Run with:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from typing import List, Tuple
from uuid import uuid4
import asyncio
import logging

from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline, AutoTokenizer

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# FastAPI app + CORS
# -----------------------------------------------------------------------------
app = FastAPI(title="Grocify ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------
class RecipeRequest(BaseModel):
    ingredients: List[str]


class Recipe(BaseModel):
    id: str
    title: str
    shortDescription: str
    instructions: str


class RecipeResponse(BaseModel):
    recipes: List[Recipe]


# -----------------------------------------------------------------------------
# Model loading (Chef Transformer)
# -----------------------------------------------------------------------------
MODEL_NAME = "flax-community/t5-recipe-generation"

logger.info(f"Loading Hugging Face recipe-generation model: {MODEL_NAME} ...")
try:
    # Use PyTorch weights via pipeline
    generator = pipeline(
        "text2text-generation",
        model=MODEL_NAME,
        tokenizer=MODEL_NAME,
        device=-1,  # CPU
    )
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
    SPECIAL_TOKENS = set(tokenizer.all_special_tokens)
    logger.info("✅ Chef Transformer model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load model: {e}")
    raise


# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------
def _clean_special_tokens(text: str) -> str:
    """
    Remove special tokens and map model-specific markers to nicer separators.
    """
    # Basic replacements from the README
    # <section> -> newline, <sep> -> item separator
    text = text.replace("<section>", "\n")
    text = text.replace("<sep>", "--")

    # Remove any tokenizer special tokens (e.g. <pad>, </s>, etc.)
    for tok in SPECIAL_TOKENS:
        text = text.replace(tok, "")

    return text.strip()


def generate_recipe_text(items_str: str, num_recipes: int = 3, max_length: int = 512) -> List[str]:
    """
    Call the Chef Transformer pipeline.

    The README uses a prefix: "items: <ingredients>"
    """
    try:
        prompt = "items: " + items_str
        outputs = generator(
            prompt,
            do_sample=True,
            top_k=60,
            top_p=0.95,
            num_return_sequences=num_recipes,
            max_length=max_length,
        )
        return [o.get("generated_text", "").strip() for o in outputs]
    except Exception as e:
        logger.error(f"Error during generation: {e}")
        raise


def parse_recipe_output(raw_text: str) -> Tuple[str, str, str]:
    """
    Parse Chef Transformer output into title, shortDescription, instructions.

    Model format (from README) roughly:
      title: ...
      ingredients: item1 -- item2 -- ...
      directions: step1 -- step2 -- ...

    We'll:
      - Extract title after 'title:'
      - Use ingredients as shortDescription summary
      - Join directions as multi-line instructions
    """
    cleaned = _clean_special_tokens(raw_text)
    lines = [l.strip() for l in cleaned.split("\n") if l.strip()]
    if not lines:
        return ("Untitled Recipe", "", cleaned)

    title = "Untitled Recipe"
    ingredients_line = ""
    directions_line = ""

    for line in lines:
        low = line.lower()
        if low.startswith("title:"):
            title = line.split(":", 1)[1].strip() or "Untitled Recipe"
        elif low.startswith("ingredients:"):
            ingredients_line = line.split(":", 1)[1].strip()
        elif low.startswith("directions:"):
            directions_line = line.split(":", 1)[1].strip()

    # Fallbacks if markers not found
    if title == "Untitled Recipe":
        title = lines[0][:80]

    # Build short description from ingredients
    short_desc = ""
    if ingredients_line:
        # ingredients separated by "--"
        ing_list = [s.strip().capitalize() for s in ingredients_line.split("--") if s.strip()]
        if ing_list:
            short_desc = "Ingredients: " + ", ".join(ing_list[:6])

    # Build instructions text from directions
    instructions = cleaned
    if directions_line:
        steps = [s.strip().capitalize() for s in directions_line.split("--") if s.strip()]
        if steps:
            instructions = "\n".join(f"{i+1}. {step}" for i, step in enumerate(steps))

    return (title[:80], short_desc[:200], instructions)


# -----------------------------------------------------------------------------
# API endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Grocify ML Service"}


@app.post("/generate-recipes", response_model=RecipeResponse)
async def generate_recipes(req: RecipeRequest):
    """
    Generate AI recipes based on a list of ingredients.
    """
    try:
        if not req.ingredients:
            raise HTTPException(
                status_code=400,
                detail="No ingredients provided. Please provide at least one ingredient.",
            )

        cleaned = [
            ing.strip().lower()
            for ing in req.ingredients
            if ing and ing.strip()
        ]
        if not cleaned:
            raise HTTPException(
                status_code=400,
                detail="No valid ingredients found after cleaning.",
            )

        items_str = ", ".join(cleaned)
        logger.info(f"Generating recipes for items: {items_str}")

        raw_outputs = await asyncio.to_thread(
            generate_recipe_text,
            items_str,
            3,
            512,
        )

        recipes_dict = {}
        for raw in raw_outputs:
            title, short_desc, instructions = parse_recipe_output(raw)
            key = title.lower()
            if key in recipes_dict:
                continue

            recipes_dict[key] = {
                "id": str(uuid4()),
                "title": title,
                "shortDescription": short_desc,
                "instructions": instructions,
            }

            if len(recipes_dict) >= 3:
                break

        recipes_list = list(recipes_dict.values())
        logger.info(f"Generated {len(recipes_list)} recipes")
        return RecipeResponse(recipes=recipes_list)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /generate-recipes: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Recipe generation failed. Please try again later.",
        )


@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Grocify ML Service started (Chef Transformer)")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Grocify ML Service shutting down")
