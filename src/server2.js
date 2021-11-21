require("dotenv").config();
import express from "express";
import redis from "socket.io-redis";
import http from "http";
import socket from "socket.io";
import { urlencoded, json } from "body-parser";
import cors from "cors";
import { createClient } from "redis";
import { create3Urls } from "./utils";
import { createBanpickPhase } from "./banpick";

const PORT = process.env.PORT;
const PORT_REDIS = process.env.PORT_REDIS;
// const client = createClient({
//   port: PORT_REDIS,
//   host: process.env.REDIS_URL,
// });
console.log(process.env.REDIS_URL);
const client = createClient(process.env.REDIS_URL);

const app = express();
app.set("port", PORT);
app.use(express.static(__dirname + "/public"));
app.use(urlencoded());
app.use(json());
app.use(cors());

const server = http.createServer(app);
const io = socket(server, { cors: { origin: "*" } });

// io.adapter(redis({ port: PORT_REDIS, host: "localhost" }));
io.adapter(redis(process.env.REDIS_URL));
// io.set("store", new socket.RedisStore());

io.on("connection", (sock) => {
  // const userName = sock.id;
  console.log(`[${sock.id}] socket connected`);

  sock.on("disconnect", () => {
    console.log(`[${sock.id}] socket disconnected`);
  });

  // sock.on("btn", (code) => {
  //   console.log("btn clicked.");
  //   client.hgetall(code, (err, data) => {
  //     if (err) throw err;
  //     console.log("find!", data[1]);
  //     sock.emit("broadcast", data);
  //   });
  // });

  sock.on("gamecode", (gamecode) => {
    client.hgetall(gamecode, (err, data) => {
      // 잘못된 요청이면 에러 발생
      if (err) throw err;

      // 로그 기록 및 데이터 반환
      console.log(`[${sock.id}] (${gamecode}) game connected`);
      sock.gamecode = gamecode;
      sock.join(gamecode);
      sock.emit("banpickPhase", data);
    });
  });

  sock.on("ready", ({ team }) => {
    client.hgetall(sock.gamecode, (err, data) => {
      if (err) console.log(err);

      if (team === "blue") {
        // 블루팀 ready
        client.hset(sock.gamecode, "isBlueReady", "true");

        // 레드팀이 ready이면 startTime 갱신
        if (data.isRedReady === "true") {
          client.hset(sock.gamecode, "startTime", `${Date.now()}`);
        }
      } else if (team === "red") {
        // 블루팀 ready
        client.hset(sock.gamecode, "isRedReady", "true");

        // 레드팀이 ready이면 startTime 갱신
        if (data.isBlueReady === "true") {
          client.hset(sock.gamecode, "startTime", `${Date.now()}`);
        }
      }
    });

    client.hgetall(sock.gamecode, (err, data) => {
      if (err) throw err;

      // 정보 변경 브로드캐스팅
      io.in(sock.gamecode).emit("banpickPhase", data);
    });
  });

  sock.on("select", (selectData) => {
    // 로그 기록
    console.log(
      `[${sock.id}] (${sock.gamecode}) select : ${selectData.phase} ${selectData.champion}`
    );

    // 밴픽 갱신
    io.in(sock.gamecode).emit("selectBroad", selectData);
  });

  sock.on("done", (selectData) => {
    // 로그 기록
    console.log(
      `[${sock.id}] (${sock.gamecode}) banpick : ${selectData.phase} ${selectData.champion}`
    );

    // 데이터 갱신
    client.hset(sock.gamecode, selectData.phase, selectData.champion);
    if (selectData.phase <= 20) {
      client.hset(sock.gamecode, "phase", selectData.phase + 1);
    }
    client.hset(sock.gamecode, "startTime", `${Date.now()}`);

    // 데이터 전송
    client.hgetall(sock.gamecode, (err, data) => {
      if (err) throw err;
      io.in(sock.gamecode).emit("banpickPhase", data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});

app.post("/link-info", (req, res) => {
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

  // 밴픽 현황 데이터 생성
  client.hmset(
    urls.gameCode,
    createBanpickPhase(req.body.blueName, req.body.redName),
    (err) => {
      if (err) throw err;
      console.log("gamecode is created :", urls.gameCode);
    }
  );
  client.expire(urls.gameCode, 5000);

  // 밴픽 링크 보내기
  res.send(sendObj);
  console.log("");
  console.log("New Ban-pick Generated!");
  console.log("- Blue Team :", req.body.blueName);
  console.log("-  Red Team :", req.body.redName);
  console.log("");
});

app.get("/check", (req, res) => {
  res.send("check test done!");
});
