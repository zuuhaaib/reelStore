/** Thrown by services/validators; the error middleware turns it into { error } with this status. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
