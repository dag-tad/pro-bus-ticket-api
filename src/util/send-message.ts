import axios from 'axios';

export async function sendSMS(to: string, message: string) {
  const url = process.env.SMS_URL!;
  const sender_short_code = process.env.SMS_SHORT_CODE!;
  await axios.post(
    url,
    {
      sender: sender_short_code,
      to,
      message,
    },
    {
      headers: {
        Authorization: process.env.SMS_AUTHORIZATION,
      },
    },
  );
}
