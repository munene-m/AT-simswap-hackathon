import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { checkSimSwap } from "./services/sim-swap";
const app = express();
dotenv.config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

function isValidPin(pin: string): boolean {
  return pin.length === 4 && /^\d+$/.test(pin);
}
let recentSwap = "";

const users: { [key: string]: { pin: string; registered: boolean } } = {};
app.use("/ussd/callback", async (req: Request, res: Response) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  let response = "";
  const textArray = text.split("*");
  const level = textArray.length;
  if (text == "") {
    response = `CON Welcome to SecureBank USSD\n1. Register\n2. Login\n3. Check Balance\n4. Make Transfer\n5. Exit`;
  } else if (text === "1") {
    if (users[phoneNumber]?.registered) {
      response = "END You are already registered.";
    } else {
      response = "CON Enter a 4-digit PIN to register:";
    }
  } else if (level === 2 && textArray[0] === "1") {
    const pin = textArray[1];
    if (pin.length === 4 && /^\d+$/.test(pin)) {
      users[phoneNumber] = { pin, registered: true };
      response = "END Registration successful. You can now login.";
    } else {
      response = "END Invalid PIN. Please try again.";
    }
  } else if (text === "2") {
    if (!users[phoneNumber]?.registered) {
      response = "END You are not registered. Please register first.";
    } else {
      response = "CON Enter your 4-digit PIN to login:";
    }
  } else if (level === 2 && textArray[0] === "2") {
    const pin = textArray[1];
    if (users[phoneNumber]?.pin === pin) {
      const recentSwap = await checkSimSwap(phoneNumber);
      if (recentSwap === "Swapped") {
        response =
          "CON Recent SIM swap detected. For security, please answer your security question:\nWhat is your mother's maiden name?";
      } else {
        response = "END Login successful.";
      }
    } else {
      response = "END Incorrect PIN. Please try again.";
    }
  } else if (level === 3 && textArray[0] === "2") {
    // Here you would typically check the answer against a stored security question answer
    // For this example, we'll accept any non-empty answer
    if (textArray[2].trim() !== "") {
      response = "END Additional verification successful. Login completed.";
    } else {
      response = "END Verification failed. Please contact customer support.";
    }
  } else if (text === "3") {
    if (users[phoneNumber]?.registered) {
      response = "END Your balance is KES 2000.";
    } else {
      response = "END Kindly Login to proceed";
    }
  } else if (text === "3") {
    if (users[phoneNumber]?.registered) {
      response = "END Your balance is KES 2000.";
    } else {
      response = "END Kindly Login to proceed";
    }
  } else if (text === "5") {
    response = "END Thank you for using SecureBank USSD.";
  } else if (text === "4") {
    if (!users[phoneNumber]?.registered) {
      response = "END You are not registered. Please register first.";
    } else {
      response = "CON Enter your 4-digit PIN to proceed with transfer:";
    }
  } else if (level === 2 && textArray[0] === "4") {
    const pin = textArray[1];
    if (users[phoneNumber]?.pin === pin) {
      recentSwap = await checkSimSwap(phoneNumber);
      if (recentSwap === "Swapped") {
        response =
          "CON Recent SIM swap detected. For security, please answer your security question:\nWhat is your mother's maiden name?";
      } else {
        response = "CON Enter the recipient's phone number:";
      }
    } else {
      response = "END Incorrect PIN. Transfer cancelled.";
    }
  } else if (level === 3 && textArray[0] === "4") {
    if (textArray[2].trim() !== "") {
      if (recentSwap === "Swapped") {
        // Here you would typically check the answer against a stored security question answer
        response =
          "CON Additional verification successful. Enter the recipient's phone number:";
      } else {
        // This is the recipient's phone number
        response = "CON Enter the amount to transfer:";
      }
    } else {
      response = "END Verification failed. Transfer cancelled.";
    }
  } else if (level === 4 && textArray[0] === "4") {
    const amount = parseFloat(textArray[3]);
    if (!isNaN(amount) && amount > 0) {
      // Here you would typically process the transfer
      response = `END Transfer of KES ${amount} to ${textArray[2]} initiated. Thank you for using SecureBank USSD.`;
    } else {
      response = "END Invalid amount. Transfer cancelled.";
    }
  }

  // Send the response back to the API
  res.set("Content-Type: text/plain");
  res.send(response);
});
app.get("/", (req, res) => {
  res.send("Welcome to simswap api hackathon");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server listening on *:${PORT}`));
