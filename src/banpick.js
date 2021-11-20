const banpickPhase = {
  phase: "1",
  startTime: "",
  blueName: "",
  redName: "",
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
  6: "",
  7: "",
  8: "",
  9: "",
  10: "",
  11: "",
  12: "",
  13: "",
  14: "",
  15: "",
  16: "",
  17: "",
  18: "",
  19: "",
  20: "",
};

export const createBanpickPhase = (blueName, redName) => {
  const newPhase = banpickPhase;
  newPhase.startTime = `${Date.now()}`;
  newPhase.blueName = blueName;
  newPhase.redName = redName;
  return newPhase;
};
