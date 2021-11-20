require("dotenv").config();
import express from "express";
import socket from "socket.io";
import { createServer } from "http";
import { createClient } from "redis";
import { urlencoded, json } from "body-parser";
import cors from "cors";
import { create3Urls } from "./utils";
import { banpickPhase } from "./banpick";

const PORT = process.env.PORT;
const PORT_REDIS = process.env.PORT_REDIS;

const app = express();
app.set("port", PORT);
app.use(express.static(__dirname + "/public"));
app.use(urlencoded());
app.use(json());
app.use(cors());
// app.options("*", cors({ origin: true }));

app.get("/ban-pick", (req, res) => {
  // console.log(req.url);
  console.log(req.query);

  res.send("지환이 안녕!");
});

app.post("/link-info", (req, res) => {
  // console.log(req.url)
  // console.log(req.body);

  // 밴픽 할 링크 생성
  const urls = create3Urls(
    req.protocol + "://" + req.get("host") + "/ban-pick"
  );

  // 밴픽 링크 반환
  const sendObj = {
    blue: {
      name: req.body.blueName,
      pathname: urls.blue.pathname + urls.blue.search,
    },
    red: {
      name: req.body.redName,
      pathname: urls.red.pathname + urls.red.search,
    },
    observer: { pathname: urls.observer.pathname + urls.observer.search },
  };
  res.send(sendObj);

  console.log("New Ban-pick Generated!");
  console.log("- Blue Team :", req.body.blueName);
  console.log("-  Red Team :", req.body.redName);
  console.log("");
});

const httpServer = createServer(app);
const io = socket(httpServer, { cors: { origin: "*" } });
const redis = createClient({ port: PORT_REDIS });

httpServer.listen(PORT, () => {
  console.log(`Server On!!`);
});

redis.on("error", (err) => {
  console.log("Error " + err);
});
// redis.on("connect", ()=>{
// })

io.on("connection", (sock) => {
  // console.log(sock);
  console.log(sock.id, "connected");
  sock.emit("banpickPhase", banpickPhase);

  sock.on("disconnet", () => {
    console.log(sock.id, "disconnected");
  });

  sock.on("select", (data) => {
    console.log(data);
  });

  sock.on("done", (data) => {
    console.log(data);
    sock.emit("banpickPhase", banpickPhase);
  });

  sock.on("banpick", (url) => {
    const uurl = new URL(`http://test/${url}`);

    // blue team이면 블루 출력
    if (uurl.searchParams.get("team") === "blue") {
      // 블루 출력
      console.log("blue");
    }

    // red team이면 레드 출력
    if (uurl.searchParams.get("team") === "red") {
      // 레드 출력
      console.log("red");
    }

    sock.emit("response", "url received!");
  });

  // sock.emit("msg", `${sock.id} 연결되었습니다.`);
  // sock.on("msg", (data) => {
  //   console.log(sock.id, data);
  //   sock.emit("msg", `server : "${data}" 받았습니다.`);
  // });
});
