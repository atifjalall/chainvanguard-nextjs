import * as grpc from "@grpc/grpc-js";
import { connect, signers, hash } from "@hyperledger/fabric-gateway";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import * as crypto from "crypto";

async function test() {
  try {
    // Use ABSOLUTE paths like the official example
    const tlsCertPath =
      "/Users/atifjalal/Desktop/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt";
    const certPath =
      "/Users/atifjalal/Desktop/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts";
    const keyPath =
      "/Users/atifjalal/Desktop/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore";

    console.log("Creating gRPC client...");
    const tlsRootCert = readFileSync(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    const client = new grpc.Client("localhost:7051", tlsCredentials, {
      "grpc.ssl_target_name_override": "peer0.org1.example.com",
    });

    console.log("Loading identity...");
    const certFiles = readdirSync(certPath);
    const credentials = readFileSync(resolve(certPath, certFiles[0]));
    const identity = { mspId: "Org1MSP", credentials };

    console.log("Loading signer...");
    const keyFiles = readdirSync(keyPath);
    const privateKeyPem = readFileSync(resolve(keyPath, keyFiles[0]));
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signer = signers.newPrivateKeySigner(privateKey);

    console.log("Connecting to gateway...");
    const gateway = connect({
      client,
      identity,
      signer,
      hash: hash.sha256,
    });

    console.log("Getting contract...");
    const network = gateway.getNetwork("supply-chain-channel");
    const contract = network.getContract("textile-scm");

    console.log("Testing createProduct...");
    const result = await contract.submitTransaction(
      "createProduct",
      "PROD_ABSOLUTE_TEST",
      "Absolute Path Test",
      "Test",
      "998",
      "9993",
      "SUP0012",
      "",
      "Testing with absolute paths"
    );

    console.log("✅ SUCCESS!", new TextDecoder().decode(result));

    gateway.close();
    client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    console.error(error);
    process.exit(1);
  }
}

test();
