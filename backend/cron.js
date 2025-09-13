// backend/cron.js
const cron = require('node-cron');
const pool = require('./db'); // PostgreSQL connection
const sendEmail = require('./utils/sendEmail'); // SendGrid email function

// Cron job: runs daily at 8:00 AM
cron.schedule('* * * * *', async () => {
  console.log('🔔 Running daily expiry check...');

  try {
    // Fetch all items with user email
    const result = await pool.query(`
      SELECT i.id, i.name, i.type, i.expiry_date, i.shelf_life, i.purchase_date, i.user_id, u.email
      FROM items i
      JOIN users u ON i.user_id = u.id
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group items by user
    const userItemsMap = {};

    result.rows.forEach(item => {
      let expiryDate = null;

      if (item.expiry_date) {
        expiryDate = new Date(item.expiry_date);
      } else if (item.shelf_life) {
        if (!item.purchase_date) return; // skip if no purchase date
        expiryDate = new Date(item.purchase_date);
        expiryDate.setDate(expiryDate.getDate() + item.shelf_life);
      }

      if (!expiryDate) return;

      expiryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if ([5, 0].includes(diffDays)) {
        if (!userItemsMap[item.user_id]) {
          userItemsMap[item.user_id] = {
            email: item.email,
            items: []
          };
        }
        userItemsMap[item.user_id].items.push({
          name: item.name,
          type: item.type,
          diffDays
        });
      }
    });

    // Send one email per user
    for (const userId in userItemsMap) {
      const userData = userItemsMap[userId];
      const items = userData.items;
      const userEmail = userData.email;

      // Sort items by nearest expiry first
      items.sort((a, b) => a.diffDays - b.diffDays);

      // Construct HTML email body
      let emailBody = `
        <h2>🛒 Grocify Reminder</h2>
        <p>Here are your items nearing expiry:</p>
        <ul>
      `;
      items.forEach(item => {
        let expiryText = '';
        if (item.diffDays === 0) {
          expiryText = 'expires <strong>today</strong>';
        } 
        if (item.diffDays === 5) {
          expiryText = 'expires in <strong>5 day</strong>';
        } else {
          expiryText = `expires in <strong>${item.diffDays} days</strong>`;
        }
        emailBody += `<li>${item.name} (${item.type}) → ${expiryText}</li>`;
      });
      emailBody += `</ul><p>✅ Stay fresh with Grocify!</p>`;

      const emailSubject = 'Grocify Reminder: Items nearing expiry';

      try {
        await sendEmail(userEmail, emailSubject, emailBody);
      } catch (err) {
        console.error(`❌ Failed to send reminder to ${userEmail}`, err);
      }
    }

  } catch (err) {
    console.error('❌ Error running cron job:', err);
  }
});
