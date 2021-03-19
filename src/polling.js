import { get } from 'axios';

let abortPoll = false;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const defaultConfigs = {
  attempts: 10,
  interval: 1000,
  successStatus: 'SUCCESS',
  errorStatus: 'ERROR',
};

export const pollingError = 'POLLING_ERROR';
export const exceedMaxAttempts = 'EXCEED_MAXIMUM_ATTEMPTS';
export const abortError = 'POLLING_ABORT';
export const successOutput = 'SUCCESS_OUTPUT';

const poll = async (uri, config = defaultConfigs) => {
  const { interval, successStatus, errorStatus, attempts } = config;
  const remainingAttempts = attempts - 1;

  const res = await get(uri);
  await sleep(interval);

  if (abortPoll) {
    return Promise.reject(abortError);
  }

  // the destructed variable here can be anything. It depends on the api response. Use 'status' for example purposes.
  const { status } = res.data;

  // you can customize what to do when api response reaches error or success state.
  if (status === errorStatus) {
    return Promise.reject(pollingError);
  }

  if (status === successStatus) {
    return Promise.resolve(successOutput);
  }

  if (remainingAttempts <= 0) {
    return Promise.reject(exceedMaxAttempts);
  }

  return poll(uri, { ...config, attempts: remainingAttempts });
};

export function startPoll(uri, config) {
  abortPoll = false;
  return poll(uri, config);
}

export function stopPoll() {
  abortPoll = true;
}
