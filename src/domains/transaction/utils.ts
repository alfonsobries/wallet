import { Services } from "@payvo/sdk";

export const isNoDeviceError = (error: any) => String(error).includes("no device found");

export const isRejectionError = (error: any) => String(error).includes("Condition of use not satisfied");

export const handleBroadcastError = ({ rejected, errors }: Services.BroadcastResponse) => {
	if (rejected.length === 0) {
		return;
	}

	throw new Error(Object.values(errors as object)[0]);
};

export const withAbortPromise = (signal?: AbortSignal, callback?: () => void) => <T>(promise: Promise<T>) =>
	new Promise<T>((resolve, reject) => {
		if (signal) {
			signal.addEventListener("abort", () => {
				callback?.();
				reject("ERR_ABORT");
			});
		}

		return promise.then(resolve).catch(reject);
	});
