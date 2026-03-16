export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          rootDir: ".",
          module: "NodeNext",
          moduleResolution: "NodeNext"
        }
      }
    ]
  },
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  verbose: true,
  detectOpenHandles: true,
  forceExit: false,
  maxWorkers: 1
};
