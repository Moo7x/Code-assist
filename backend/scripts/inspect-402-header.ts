
async function main() {
    const response = await fetch("http://localhost:3000/api/bounty/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });

    console.log("Status:", response.status);
    const header = response.headers.get("PAYMENT-REQUIRED");
    if (header) {
        console.log("PAYMENT-REQUIRED (Base64):", header);
        const decoded = Buffer.from(header, "base64").toString("utf-8");
        console.log("Decoded requirements:", JSON.stringify(JSON.parse(decoded), null, 2));
    } else {
        console.log("No PAYMENT-REQUIRED header found");
    }
}

main();
