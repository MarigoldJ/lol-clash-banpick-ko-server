const generateGameCode = () => {
  const a = `${Date.now() % 10 ** 12}`.padStart(12, "0");
  const b = `${parseInt(Math.random() * 10 ** 4)}`.padStart(4, "0");

  const c = [a.substr(0, 4), a.substr(4, 4), a.substr(8, 4), b];

  return c.join("-");
};

export const create3Urls = (url) => {
  // blue, red, observer
  const urls = [new URL(url), new URL(url), new URL(url)];

  // add params : gameCode
  const gameCode = generateGameCode();
  urls.map((url) => {
    url.searchParams.append("game", gameCode);
    return url;
  });

  // add params : teamCode
  urls[0].searchParams.append("team", "blue");
  urls[1].searchParams.append("team", "red");

  return {
    blue: urls[0],
    red: urls[1],
    observer: urls[2],
    gameCode,
  };
};
