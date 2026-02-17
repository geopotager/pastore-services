import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_NAME = process.env.APP_NAME;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// 🔍 Debug au démarrage
console.log("🔐 RESEND KEY PRESENT:", !!process.env.RESEND_API_KEY);
console.log("🔐 RESEND KEY PREFIX:", process.env.RESEND_API_KEY?.substring(0, 10));
console.log("📧 EMAIL_FROM:", EMAIL_FROM);
console.log("📧 ADMIN_EMAIL:", ADMIN_EMAIL);

export async function sendNewRequestEmails(data) {

  const htmlAdmin = `
    <h2>Nouvelle demande : ${data.category}</h2>
    <p><strong>Client :</strong> ${data.contact.name}</p>
    <p><strong>Email :</strong> ${data.contact.email}</p>
    <p><strong>Téléphone :</strong> ${data.contact.phone}</p>
    <p><strong>Adresse :</strong> ${data.contact.address}, ${data.contact.zip}</p>
    <hr/>
    <p>${data.description}</p>
    <p><strong>Date souhaitée :</strong> ${data.booking.date} à ${data.booking.time}</p>
  `;

  const htmlClient = `
    <h3>Merci ${data.contact.name},</h3>
    <p>Nous avons bien reçu votre demande pour : <strong>${data.category}</strong>.</p>
    <p>Nous vous recontacterons rapidement pour confirmer votre rendez-vous.</p>
    <br/>
    <p>L'équipe ${APP_NAME}</p>
  `;

  try {
    // 📤 Email Admin
    const adminResponse = await resend.emails.send({
      from: `${APP_NAME} <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `Nouvelle demande - ${data.category}`,
      html: htmlAdmin,
    });

    console.log("📨 Admin Email Response:", adminResponse);

    // 📤 Email Client
    if (data.contact.email) {
      const clientResponse = await resend.emails.send({
        from: `${APP_NAME} <${EMAIL_FROM}>`,
        to: data.contact.email,
        subject: "Confirmation de votre demande",
        html: htmlClient,
      });

      console.log("📨 Client Email Response:", clientResponse);
    }

    console.log("✅ Emails envoyés via Resend");

  } catch (error) {
    console.error("❌ Erreur envoi Resend:", error);
  }
}
