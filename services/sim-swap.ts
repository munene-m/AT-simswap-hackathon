import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

type STATUS =
  | "Swapped"
  | "Queued"
  | "NoSwapDate"
  | "Failed"
  | "InvalidPhoneNumber"
  | "InsufficientBalance"
  | "UnsupportedPhoneNumber";

const africastalking_key = process.env.AFRICASTALKING_API_KEY;
export async function checkSimSwap(phoneNumber: string): Promise<STATUS> {
  try {
    const checkSwap = await axios.post(
      "https://insights.sandbox.africastalking.com/v1/sim-swap",
      {
        phoneNumbers: [phoneNumber],
        username: "sandbox",
      },
      {
        headers: {
          apiKey: `${africastalking_key}`,
        },
      }
    );
    // console.log(checkSwap.data);
    return checkSwap.data.responses[0].status;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}
