const buildStatus = await new Deno.Command("g++", {
  args: ["-fPIC", "-c", "./lib.cpp"],
  cwd: "./session-2",
}).spawn().status;

if (buildStatus.success === false) {
  throw new Error("Failed to build test.cpp");
}

const libBuildStatus = await new Deno.Command("g++", {
  args: ["--shared", "-o", "libsession-2.so", "lib.o"],
  cwd: "./session-2",
}).spawn().status;

if (libBuildStatus.success === false) {
  throw new Error("Failed to build libtest.so");
}
