import "express-session";
declare module "express-session" {
  interface SessionData {
    studentId: string;
    studentName: string;
    gender: string;
    urlId: string;
  }
}
