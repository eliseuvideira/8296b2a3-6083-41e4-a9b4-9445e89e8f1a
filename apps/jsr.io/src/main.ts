import { HttpClient } from "@scrappers/http-client";

const main = async () => {
  const http = HttpClient("https://jsr.io");
  const response = await http.request({
    method: "GET",
    path: "/@oak/oak",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
