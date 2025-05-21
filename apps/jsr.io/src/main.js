"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_client_1 = require("@scrappers/http-client");
const main = async () => {
    const response = await http_client_1.http.request("https://jsr.io/@oak/oak", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
    });
    console.log(response.statusCode);
};
main()
    .then(() => {
    process.exit(0);
})
    .catch(() => {
    process.exit(1);
});
