interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[Email] To:', to)
    console.info('[Email] Subject:', subject)
    console.info('[Email] HTML:', html)
    return
  }

  // TODO: integrate SMTP provider using env.smtpUrl
  console.warn('SMTP not configured. Email not sent:', { to, subject })
}
