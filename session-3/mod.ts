import {
  cstr,
  CStringArray,
  cxstringToString,
  provideCXStringAPI,
} from "./utils.ts";

const buf = (_type: unknown) => "buffer" as const;
const ptr = (_type: unknown) => "pointer" as const;
const func = (_definition: Deno.UnsafeCallbackDefinition) =>
  "function" as const;

// Builtins
const int = "i32";
const uint = "u32";
const cstringT = "buffer" as const;
const cstringArrayT = "buffer" as const;

// Enums
import { CXCursorKind } from "./CXCursorKind.ts";
const CXCursorKindT = uint;
const enum CXChildVisitResult {
  CXChildVisit_Break,
  CXChildVisit_Continue,
  CXChildVisit_Recurse,
}
const CXChildVisitResultT = uint;

// Typedefs
const CXStringT = { struct: ["pointer", "u32"] } as const;
const CXIndexT = "pointer" as const;
const CXTranslationUnitT = "pointer" as const;

/**
 * CXCursor
 */
const CXCursorT = {
  /** Struct size: 32 */
  struct: [
    CXCursorKindT, // kind, offset 0, size 4
    int, // xdata, offset 4, size 4
    ptr("void"), // data[0], offset 8, size 8
    ptr("void"), // data[1], offset 16, size 8
    ptr("void"), // data[2], offset 24, size 8
  ],
} as const;

// Callbacks
const CXCursorVisitorCallbackDefinition = {
  parameters: [
    CXCursorT, // cursor
    CXCursorT, // parent
    ptr("CXClientDataT"), // client_data
  ],
  result: CXChildVisitResultT,
} as const;

const { symbols: libclang } = Deno.dlopen("/usr/lib/libclang.so", {
  clang_getCString: {
    parameters: [CXStringT],
    result: "pointer",
  },
  clang_disposeString: {
    parameters: [
      CXStringT, // string
    ],
    result: "void",
  },
  clang_getClangVersion: {
    parameters: [],
    result: CXStringT,
  },
  /**
   * @param excludeDeclsFromPCH (0 or 1)
   * @param displayDiagnostics (0 or 1)
   */
  clang_createIndex: {
    parameters: [int, int],
    result: CXIndexT,
  },
  /**
   * @param index
   * @param sourceFileName
   * @param numberOfClangCommandLineArgs
   * @param clangCommandLineArgs
   * @param numberOfUnsavedFiles
   * @param unsavedFiles
   */
  clang_createTranslationUnitFromSourceFile: {
    parameters: [
      CXIndexT,
      cstringT,
      int,
      cstringArrayT,
      uint,
      buf("CXUnsavedFile"),
    ],
    result: CXTranslationUnitT,
  },
  clang_getTranslationUnitCursor: {
    parameters: [
      CXTranslationUnitT,
    ],
    result: CXCursorT,
  },
  clang_getCursorKind: {
    parameters: [
      CXCursorT,
    ],
    result: CXCursorKindT,
  },
  clang_visitChildren: {
    parameters: [
      CXCursorT,
      func(CXCursorVisitorCallbackDefinition),
      ptr("CXClientDataT"),
    ],
    result: uint,
  },
  clang_getCursorKindSpelling: {
    parameters: [
      CXCursorKindT, // Kind
    ],
    result: CXStringT,
  },
  clang_getCursorSpelling: {
    parameters: [
      CXCursorT,
    ],
    result: CXStringT,
  },
});

const ver = libclang.clang_getClangVersion();
console.log(
  Deno.UnsafePointerView.getCString(libclang.clang_getCString(ver)),
);

provideCXStringAPI(libclang.clang_getCString, libclang.clang_disposeString);

console.log(cxstringToString(ver));

const index = libclang.clang_createIndex(0, 1);
const args = new CStringArray(["-xc++", "-I/usr/lib/clang/15.0.7/include"]);
const tu = libclang.clang_createTranslationUnitFromSourceFile(
  index,
  cstr("./session-2/lib.cpp"),
  2,
  args,
  0,
  null,
);

console.log(tu);

const cursor = libclang.clang_getTranslationUnitCursor(tu);

console.log("Cursor:", cursor);

console.log("Cursor kind:", libclang.clang_getCursorKind(cursor));

let visitorCb = (
  cursor: Uint8Array,
  parentCursor: Uint8Array,
): CXChildVisitResult => {
  throw new Error("Invalid callback");
};
const VISITOR_CB = new Deno.UnsafeCallback(
  CXCursorVisitorCallbackDefinition,
  (cursor, parentCursor, _userData): CXChildVisitResult =>
    visitorCb(cursor, parentCursor),
);

const visitChildren = (cursor: Uint8Array, cb: typeof visitorCb): number => {
  const prevCb = visitorCb;
  visitorCb = cb;
  const result = libclang.clang_visitChildren(cursor, VISITOR_CB.pointer, 0);
  visitorCb = prevCb;
  return result;
};

visitChildren(cursor, (child) => {
  const kind = libclang.clang_getCursorKind(child);
  if (kind === CXCursorKind.CXCursor_Namespace) {
    const spelling = cxstringToString(libclang.clang_getCursorSpelling(child));
    console.group("Namespace:", spelling);
    if (spelling === "lib") {
      visitChildren(child, (child) => {
        const kind = libclang.clang_getCursorKind(child);
        console.log(
          "Child cursor kind:",
          kind,
          "spelling:",
          cxstringToString(
            libclang.clang_getCursorKindSpelling(kind),
          ),
        );
        console.log(
          "Child cursor spelling:",
          cxstringToString(libclang.clang_getCursorSpelling(child)),
        );
        return CXChildVisitResult.CXChildVisit_Recurse;
      });
      return CXChildVisitResult.CXChildVisit_Break;
    }
    console.groupEnd();
  }
  return CXChildVisitResult.CXChildVisit_Continue;
});
