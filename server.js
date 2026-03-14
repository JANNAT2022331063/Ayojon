require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const axios = require("axios");

const app = express();
app.use(cors());

// --- MIDDLEWARE: Allow large files (Images up to 50mb) ---
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// --- SERVE STATIC FILES ---
app.use(express.static(__dirname));

// --- DATABASE CONNECTION (FIXED) ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Leave empty for XAMPP
  database: "ayojon_db",
  port: 3306, // <--- XAMPP default port
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Failed:", err.message);
    console.log(
      "💡 TIP: If using XAMPP, check if Port is 3306 or 3307 in Config."
    );
  } else {
    console.log("✅ Ayojon Database Connected Successfully on Port 3306");
  }
});

// --- EMAIL CONFIGURATION ---
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  transporter.verify((error, success) => {
    if (error) console.error("❌ Email Error:", error.message);
    else console.log("✅ Email ready:", process.env.EMAIL_USER);
  });
} else {
  console.log(
    "⚠️ Email not configured - set EMAIL_USER and EMAIL_PASSWORD in .env"
  );
}

// Email helper function
async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.warn(`⚠️  [EMAIL SKIPPED - No Transporter] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    const info = await transporter.sendMail({
      from: `"Ayojon Events" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`✅ Email sent successfully to: ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Email Sending Failed to ${to}:`, err.message);
    if (err.message.includes('BadCredentials') || err.message.includes('535-5.7.8')) {
      console.error("💡 TIP: Your Gmail App Password may be invalid for the current EMAIL_USER. Please update it in .env");
    }
    return false;
  }
}

// --- SMS CONFIGURATION ---
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log("📱 Twilio SMS initialized");
}

async function sendSMS(phone, message) {
  try {
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      console.log(`✅ SMS sent via Twilio to ${phone}`);
      return true;
    }
    console.log(`⚠️  [MOCK SMS] To: ${phone}, Message: ${message}`);
    return false;
  } catch (err) {
    console.error("❌ SMS Error:", err.message);
    return false;
  }
}

// --- AUTH ROUTES ---

// 1. User Signup
app.post("/auth/signup/user", (req, res) => {
  const { full_name, email, phone, password, address, profile_pic } = req.body;

  if (!full_name || !email || !phone || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  const sql = `INSERT INTO users (full_name, email, phone, address, password, profile_pic) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [full_name, email, phone, address || null, password, profile_pic || null],
    (err) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, message: "Signup Successful!" });
    }
  );
});

// 2. Admin Signup
app.post("/auth/signup/admin", (req, res) => {
  const { full_name, email, phone, password, profile_pic, admin_key } = req.body;

  // Security Check: Secret Admin Key
  const SECRET_ADMIN_KEY = process.env.ADMIN_SIGNUP_KEY || "ayojon_admin_2026";
  if (admin_key !== SECRET_ADMIN_KEY) {
    console.warn(`🔐 Unauthorized Admin Signup attempt from: ${email}`);
    return res.json({ success: false, message: "Invalid Secret Admin Key! Access Denied." });
  }

  // Debug logging
  console.log("🔍 Admin Signup Request:");
  console.log("  - Full Name:", full_name);
  console.log("  - Email:", email);
  console.log("  - Phone:", phone);

  const sql = `INSERT INTO admins (full_name, email, phone, password, secret_entry_code, profile_pic) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [full_name, email, phone, password, admin_key, profile_pic || null], (err) => {
    if (err) {
      console.error("❌ Admin Signup Error:", err.message);
      return res.json({ success: false, error: err.message });
    }
    console.log("✅ Admin signup successful");
    res.json({ success: true, message: "Admin Signup Successful!" });
  });
});

// 3. Organizer Signup
app.post("/auth/signup/organizer", (req, res) => {
  const d = req.body;
  const values = [
    d.full_name,
    d.email,
    d.phone,
    d.password,
    d.org_name || "",
    d.org_type || "",
    d.org_email || "",
    d.official_address || "",
    d.website || "",
    d.social_link || "",
    d.alt_contact || "",
    d.license_number || "",
    d.tax_number || "",
    d.preferred_categories || "",
    d.org_logo || null,
    d.profile_pic || null,  // Add profile_pic
    d.bkash_number || "",
    d.nagad_number || "",
    d.upay_number || "",
    d.rocket_number || "",
    d.payment_method || "",
    d.payment_number || "",
    0,
  ];

  const sql = `INSERT INTO organizers 
    (full_name, email, phone, password, org_name, org_type, org_email, official_address, website, social_link, alt_contact, license_number, tax_number, preferred_categories, org_logo, profile_pic, bkash_number, nagad_number, upay_number, rocket_number, payment_method, payment_number, is_approved) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  db.query(sql, values, (err) => {
    if (err)
      return res.json({
        success: false,
        message: "Database Error: " + err.message,
      });
    res.json({ success: true, message: "Wait for admin approval" });
  });
});

// 4. Unified Login
app.post("/auth/login/:role", (req, res) => {
  const { email, password } = req.body;
  const role = req.params.role;

  let table = "users";
  if (role === "organizer") table = "organizers";
  if (role === "admin") table = "admins";

  const sql = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;

  db.query(sql, [email, password], (err, results) => {
    if (err) return res.json({ success: false, error: err.message });

    if (results.length > 0) {
      const user = results[0];
      if (role === "organizer" && user.is_approved === 0) {
        return res.json({
          success: false,
          message: "Account is pending. Wait for Admin Approval.",
        });
      }
      user.role = role;
      res.json({ success: true, user: user });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  });
});

// --- ADMIN & EVENT ROUTES ---

app.get("/admin/organizers", (req, res) => {
  const sql = `SELECT * FROM organizers`;
  db.query(sql, (err, data) => {
    if (err) return res.json([]);
    res.json(data);
  });
});

app.post("/admin/approve-organizer", (req, res) => {
  const { id } = req.body;

  // 1. Get organizer details first
  db.query(
    `SELECT full_name, email FROM organizers WHERE id = ?`,
    [id],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, error: "Organizer not found" });
      }

      const org = results[0];

      // 2. Update status
      db.query(
        `UPDATE organizers SET is_approved = 1 WHERE id = ?`,
        [id],
        async (err) => {
          if (err) return res.json({ success: false, error: err.message });

          // 3. Send Welcome Email
          const subject = "Welcome to Ayojon! Your Account is Approved";
          const emailHTML = `
            <h3>Hello ${org.full_name},</h3>
            <p>Congratulations! Your organizer account on <strong>Ayojon</strong> has been verified and approved by our administrative team.</p>
            <p>You can now log in to your dashboard to start creating and managing your events.</p>
            <p><a href="http://localhost:5000/index.html" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login to Your Dashboard</a></p>
            <p>We are excited to have you on board!</p>
            <p>Best regards,<br>The Ayojon Team</p>
          `;

          await sendEmail(org.email, subject, emailHTML);

          res.json({ success: true, message: "Organizer Approved & Notified." });
        }
      );
    }
  );
});

app.post("/admin/reject-organizer", (req, res) => {
  const { id } = req.body;
  console.log(`🗑️  Attempting to reject organizer with ID: ${id}`);

  // 1. Get organizer details for notification before deleting
  db.query(
    `SELECT full_name, email, org_email FROM organizers WHERE id = ?`,
    [id],
    async (err, results) => {
      if (err) {
        console.error("❌ Error fetching organizer for rejection:", err.message);
        return res.json({ success: false, error: "Database error" });
      }

      if (!results || results.length === 0) {
        console.warn(`⚠️  Organizer NOT found for ID: ${id}`);
        return res.json({ success: false, error: "Organizer not found" });
      }

      const org = results[0];
      console.log(`👤 Found Organizer: ${org.full_name} (${org.email})`);

      // 2. Delete from database
      db.query(`DELETE FROM organizers WHERE id = ?`, [id], async (err) => {
        if (err) {
          console.error(`❌ Error deleting organizer ID ${id}:`, err.message);
          return res.json({ success: false, error: err.message });
        }

        console.log(`✅ Organizer ID ${id} deleted from database`);

        // 3. Send Decline Email to both personal and organization email
        const subject = "Application Update: Ayojon Organizer Program";
        const emailHTML = `
          <h3>Hello ${org.full_name},</h3>
          <p>Thank you for your interest in joining Ayojon as an organizer.</p>
          <p>After carefully reviewing your application and business details, we regret to inform you that we cannot approve your organizer account at this time.</p>
          <p>Your application has been declined and your data has been removed from our pending queue. If you believe this was a mistake or would like to re-apply with additional documentation in the future, please feel free to reach out.</p>
          <p>Best regards,<br>The Ayojon Admin Team</p>
        `;

        try {
          console.log(`📧 Sending decline email to ${org.email}...`);
          await sendEmail(org.email, subject, emailHTML);
          console.log(`✨ Notification sent to organizer ID ${id}`);
        } catch (emailErr) {
          console.error("⚠️ Email sending failed:", emailErr.message);
        }

        res.json({ success: true, message: "Organizer Rejected & Notified." });
      });
    }
  );
});

app.post("/update-pic", (req, res) => {
  const { id, role, imageBase64, field } = req.body;
  let table =
    role === "organizer" ? "organizers" : role === "admin" ? "admins" : "users";

  // Determine which column to update
  let col;
  if (role === "organizer") {
    // For organizers, check the 'field' parameter to distinguish between logo and profile pic
    col = field === "logo" ? "org_logo" : "profile_pic";
  } else {
    // For users and admins, always update profile_pic
    col = "profile_pic";
  }

  db.query(
    `UPDATE ${table} SET ${col} = ? WHERE id = ?`,
    [imageBase64, id],
    (err) => {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});

app.get("/events", (req, res) => {
  const sql = `SELECT events.*,                organizers.full_name AS organizer_name, 
                organizers.email AS email,
                organizers.phone AS phone,
                organizers.org_name, 
                organizers.org_logo,
                organizers.profile_pic as org_profile_pic,
                organizers.org_type,
                organizers.org_email AS business_email,
                organizers.official_address as org_address,
                organizers.website as org_website,
                organizers.social_link as org_social,
                organizers.license_number as org_license,
                organizers.tax_number as org_tax,
                organizers.bkash_number, 
                organizers.nagad_number, 
                organizers.upay_number, 
                organizers.rocket_number, 
                organizers.payment_method, 
                organizers.payment_number 
               FROM events 
               JOIN organizers ON events.organizer_id = organizers.id 
               WHERE event_date >= CURDATE() 
               ORDER BY event_date ASC`;
  db.query(sql, (err, data) => res.json(data || []));
});

app.get("/my-events/:orgId", (req, res) => {
  db.query(
    `SELECT * FROM events WHERE organizer_id = ? ORDER BY event_date DESC`,
    [req.params.orgId],
    (err, data) => res.json(data)
  );
});

app.post("/events", (req, res) => {
  const d = req.body;
  const sql = `INSERT INTO events (organizer_id, title, description, location, event_date, start_time, reg_deadline, ticket_price, service_charge, total_seats, remaining_seats, contact_number, social_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  db.query(
    sql,
    [
      d.orgId,
      d.title,
      d.desc,
      d.loc,
      d.date,
      d.time,
      d.deadline,
      d.price,
      d.charge,
      d.seats,
      d.seats,
      d.contact,
      d.social_link || null,
    ],
    (err) => {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/events/:id", (req, res) => {
  db.query(`DELETE FROM events WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// --- BOOKING ROUTES ---

app.post("/book", async (req, res) => {
  const d = req.body;

  db.query(
    "SELECT id FROM bookings WHERE transaction_id = ?",
    [d.transactionId],
    (err, existing) => {
      if (existing && existing.length > 0)
        return res.json({
          success: false,
          error: "Transaction ID already used.",
        });

      const sql = `INSERT INTO bookings (user_id, event_id, quantity, total_cost, payment_gateway, transaction_id, payment_phone, payment_status) VALUES (?,?,?,?,?,?,?,?)`;

      db.query(
        sql,
        [
          d.userId,
          d.eventId,
          d.qty,
          d.total,
          d.gateway,
          d.transactionId,
          d.paymentPhone,
          "pending",
        ],
        async (err, result) => {
          if (err) return res.json({ success: false, error: err.message });

          db.query(
            `UPDATE events SET remaining_seats = remaining_seats - ? WHERE id = ?`,
            [d.qty, d.eventId]
          );

          // Fetch event/organizer details for 'Booking Received' email
          db.query(
            `SELECT events.title, organizers.org_name FROM events 
             JOIN organizers ON events.organizer_id = organizers.id 
             WHERE events.id = ?`,
            [d.eventId],
            async (err, events) => {
              if (events && events.length > 0) {
                console.log(`📧 Sending 'Booking Received' email to: ${d.email}`);
                await sendEmail(
                  d.email,
                  `Booking Received: ${events[0].title}`,
                  `<h3>Hello!</h3>
                   <p>Your booking for <strong>"${events[0].title}"</strong> has been received and is now pending approval.</p>
                   <p>Organised by: ${events[0].org_name}</p>
                   <p>We will notify you once the organiser verifies your payment.</p>
                   <p>Best regards,<br>The Ayojon Team</p>`
                );
              } else {
                console.warn(`⚠️ Could not fetch event details for email (Event ID: ${d.eventId})`);
              }
            }
          );

          res.json({ success: true });
        }
      );
    }
  );
});

app.get("/user-bookings/:userId", (req, res) => {
  const sql = `SELECT b.*, e.title, e.event_date, e.location FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ? AND b.payment_status != 'rejected' ORDER BY e.event_date DESC`;
  db.query(sql, [req.params.userId], (err, data) => res.json(data || []));
});

app.get("/organizer-bookings/:organizerId", (req, res) => {
  const sql = `SELECT 
                bookings.id AS booking_id,
                bookings.quantity,
                bookings.total_cost,
                bookings.payment_gateway,
                bookings.transaction_id,
                bookings.payment_phone,
                bookings.payment_status,
                events.title AS event_title, 
                users.full_name, 
                users.email, 
                users.phone
               FROM bookings
               JOIN events ON bookings.event_id = events.id
               JOIN users ON bookings.user_id = users.id
               WHERE events.organizer_id = ?
               ORDER BY bookings.id DESC`;

  db.query(sql, [req.params.organizerId], (err, data) => {
    if (err) {
      console.error("❌ SQL Error:", err.message);
      return res.json([]);
    }

    // Log exactly what we found
    console.log(`📊 Found ${data.length} records for Organizer ${req.params.organizerId}`);
    if (data.length > 0) {
      console.log("🔍 [DATA SCAN] First row contents:");
      console.table(data[0]); // This prints a beautiful table in terminal
    }

    res.json(data);
  });
});

app.post("/approve-booking", async (req, res) => {
  const { bookingId } = req.body;

  db.query(
    "UPDATE bookings SET payment_status = ? WHERE id = ?",
    ["approved", bookingId],
    async (err) => {
      if (err) return res.json({ success: false, error: err.message });

      // Get user & event info for notification
      db.query(
        `SELECT u.email, u.phone, u.full_name, e.title, e.location, e.event_date, e.start_time, e.contact_number
         FROM bookings b 
         JOIN users u ON b.user_id = u.id 
         JOIN events e ON b.event_id = e.id 
         WHERE b.id = ?`,
        [bookingId],
        async (err, result) => {
          if (result && result.length) {
            const info = result[0];

            // 1. Send Detailed Welcome Email
            await sendEmail(
              info.email,
              `Welcome to "${info.title}" - Booking Confirmed!`,
              `<h3>Hello ${info.full_name},</h3>
               <p>Congratulations! Your payment for the event <strong>"${info.title}"</strong> has been verified and your booking is now <strong>Approved</strong>.</p>
               <hr>
               <h4>Event Details:</h4>
               <ul>
                 <li><strong>Location:</strong> ${info.location}</li>
                 <li><strong>Date:</strong> ${new Date(info.event_date).toLocaleDateString()}</li>
                 <li><strong>Time:</strong> ${info.start_time}</li>
               </ul>
               <p>If you have any questions, feel free to contact the organizer at: <strong>${info.contact_number}</strong></p>
               <p>We look forward to seeing you there!</p>
               <p>Best regards,<br>The Ayojon Team</p>`
            );

            // 2. Send SMS to Signup Phone
            const smsMsg = `Hello ${info.full_name}, your booking for "${info.title}" is approved! - Ayojon Team`;
            await sendSMS(info.phone, smsMsg);
            console.log(`📱 SMS Notification sent to ${info.phone}`);
          }
        }
      );
      res.json({ success: true });
    }
  );
});

app.post("/reject-booking", async (req, res) => {
  const { bookingId } = req.body;

  db.query(
    `SELECT b.*, u.email, u.phone, u.full_name, e.title 
     FROM bookings b 
     JOIN users u ON b.user_id = u.id 
     JOIN events e ON b.event_id = e.id 
     WHERE b.id = ?`,
    [bookingId],
    (err, bookings) => {
      if (err || !bookings.length)
        return res.json({ success: false, error: "Booking not found" });

      const b = bookings[0];

      // 1. Refund seats
      db.query(
        "UPDATE events SET remaining_seats = remaining_seats + ? WHERE id = ?",
        [b.quantity, b.event_id]
      );

      // 2. Update status
      db.query(
        "UPDATE bookings SET payment_status = ? WHERE id = ?",
        ["rejected", bookingId],
        async (err) => {
          if (err) return res.json({ success: false, error: err.message });

          // 3. Notify user
          await sendEmail(
            b.email,
            `Booking Declined: ${b.title}`,
            `<h3>Hello ${b.full_name},</h3>
             <p>We regret to inform you that your payment for <strong>"${b.title}"</strong> could not be verified.</p>
             <p>As a result, your booking has been <strong>Rejected</strong> and your seats have been released.</p>`
          );

          const smsMsg = `Hello ${b.full_name}, your booking for "${b.title}" was rejected due to payment verification failure. - Ayojon Team`;
          await sendSMS(b.phone, smsMsg);

          res.json({ success: true });
        }
      );
    }
  );
});

app.get("/event-users/:eventId", (req, res) => {
  const sql = `SELECT b.*, b.id AS booking_id, u.full_name, u.email, u.phone 
               FROM bookings b 
               JOIN users u ON b.user_id = u.id 
               WHERE b.event_id = ? AND b.payment_status != 'rejected'`;
  db.query(sql, [req.params.eventId], (err, data) => res.json(data || []));
});

// --- UPDATE EVENT ROUTE ---
app.put("/events/:id", async (req, res) => {
  const eventId = req.params.id;
  const d = req.body;

  db.query(
    "SELECT * FROM events WHERE id = ?",
    [eventId],
    async (err, oldEvents) => {
      if (err || !oldEvents.length)
        return res.json({ success: false, error: "Event not found" });

      const oldEvent = oldEvents[0];
      const updates = [];
      const values = [];
      let changesCount = 0;

      // Helper to handle date comparison (Normalizing to ISO string date part)
      const isDateChanged = (newVal, oldVal) => {
        if (!newVal) return false;
        const n = new Date(newVal).toISOString().split('T')[0];
        const o = new Date(oldVal).toISOString().split('T')[0];
        return n !== o;
      };

      if (d.title && d.title !== oldEvent.title) {
        updates.push("title = ?");
        values.push(d.title);
        changesCount++;
      }
      if (d.desc && d.desc !== oldEvent.description) {
        updates.push("description = ?");
        values.push(d.desc);
        changesCount++;
      }
      if (d.loc && d.loc !== oldEvent.location) {
        updates.push("location = ?");
        values.push(d.loc);
        changesCount++;
      }
      if (isDateChanged(d.date, oldEvent.event_date)) {
        updates.push("event_date = ?");
        values.push(d.date);
        changesCount++;
      }
      if (d.time && d.time !== oldEvent.start_time) {
        updates.push("start_time = ?");
        values.push(d.time);
        changesCount++;
      }
      if (isDateChanged(d.deadline, oldEvent.reg_deadline)) {
        updates.push("reg_deadline = ?");
        values.push(d.deadline);
        changesCount++;
      }
      if (d.price && parseFloat(d.price) !== parseFloat(oldEvent.ticket_price)) {
        updates.push("ticket_price = ?");
        values.push(d.price);
        changesCount++;
      }
      if (d.charge && parseFloat(d.charge) !== parseFloat(oldEvent.service_charge)) {
        updates.push("service_charge = ?");
        values.push(d.charge);
        changesCount++;
      }
      if (d.seats && parseInt(d.seats) !== parseInt(oldEvent.total_seats)) {
        const seatDiff = parseInt(d.seats) - parseInt(oldEvent.total_seats);
        updates.push("total_seats = ?");
        values.push(d.seats);
        updates.push("remaining_seats = remaining_seats + ?");
        values.push(seatDiff);
        changesCount++;
      }
      if (d.contact && d.contact !== oldEvent.contact_number) {
        updates.push("contact_number = ?");
        values.push(d.contact);
        changesCount++;
      }
      if (d.social_link !== undefined && d.social_link !== oldEvent.social_link) {
        updates.push("social_link = ?");
        values.push(d.social_link);
        changesCount++;
      }

      if (changesCount === 0)
        return res.json({ success: true, changesCount: 0, message: "No styling changes detected" });

      values.push(eventId);

      db.query(
        `UPDATE events SET ${updates.join(", ")} WHERE id = ?`,
        values,
        async (err) => {
          if (err) return res.json({ success: false, error: err.message });

          // Notify booked users
          db.query(
            `SELECT DISTINCT u.email, u.full_name FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             WHERE b.event_id = ? AND b.payment_status = 'approved'`,
            [eventId],
            async (err, users) => {
              if (users && users.length > 0) {
                const eventTitle = d.title || oldEvent.title;
                for (const user of users) {
                  await sendEmail(
                    user.email,
                    `Event Update: ${eventTitle}`,
                    `<h3>Hello ${user.full_name},</h3>
                     <p>The organizer has updated some details for <strong>"${eventTitle}"</strong> which you have booked.</p>
                     <p>Please check your dashboard to see the latest schedule and details.</p>`
                  );
                }
              }
            }
          );

          res.json({ success: true, changesCount });
        }
      );
    }
  );
});

// --- ADMIN PUBLIC ROUTES ---
app.get("/admins/public", (req, res) => {
  db.query("SELECT id, full_name, email, phone, profile_pic FROM admins", (err, data) => {
    if (err) return res.json([]);
    res.json(data);
  });
});

// --- START SERVER (FIXED PORT 5000) ---
const PORT = process.env.PORT || 5000; // Changed to 5000 to avoid conflicts
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});