import axios from 'axios';
import {
  startPoll,
  stopPoll,
  defaultConfigs,
  pollingError,
  exceedMaxAttempts,
  abortError,
  successOutput,
} from './polling';

const testUri = '/api/test';
jest.mock('axios');

const flushPromises = () => {
  return new Promise((resolve) => setImmediate(resolve));
};

describe('polling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should poll until maximum attempts reach', async () => {
    expect.assertions(3);
    const mockedResponse = {
      data: {
        status: 'NOT_READY',
      },
    };

    axios.get.mockImplementation(() => Promise.resolve(mockedResponse));
    startPoll(testUri).catch((err) => expect(err).toBe(exceedMaxAttempts));
    for (let i = 0; i < defaultConfigs.attempts + 1; i += 1) {
      await flushPromises();
      jest.runAllTimers();
    }

    expect(axios.get).toHaveBeenCalledTimes(defaultConfigs.attempts);

    axios.get(testUri).then((res) => expect(res).toBe(mockedResponse));
  });

  it('should stop polling when successStatus is reached', async () => {
    expect.assertions(2);
    const mockedSuccessResponse = {
      data: {
        status: defaultConfigs.successStatus,
      },
    };

    axios.get
      .mockImplementationOnce(() =>
        Promise.resolve({ data: { status: 'ACCEPTED_FOR_PROVISIONING' } }),
      )
      .mockImplementationOnce(() => Promise.resolve(mockedSuccessResponse));

    startPoll(testUri).then((res) => expect(res).toBe(successOutput));

    for (let i = 0; i < defaultConfigs.attempts + 1; i += 1) {
      await flushPromises();
      jest.runAllTimers();
    }

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('should stop polling when errorStatus is reached', async () => {
    expect.assertions(2);

    axios.get
      .mockImplementationOnce(() =>
        Promise.resolve({ data: { status: 'ACCEPTED_FOR_PROVISIONING' } }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ data: { status: 'ACCEPTED_FOR_PROVISIONING' } }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ data: { status: defaultConfigs.errorStatus } }),
      );
    startPoll(testUri).catch((err) => expect(err).toBe(pollingError));

    for (let i = 0; i < defaultConfigs.attempts + 1; i += 1) {
      await flushPromises();
      jest.runAllTimers();
    }

    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it('should stop polling when stopPoll is fired', async () => {
    expect.assertions(2);
    const NUM_OF_POLLS_PRIOR_FIRING_STOP_POLL = 5;

    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { status: 'ACCEPTED_FOR_PROVISIONING' } }),
    );

    startPoll(testUri).catch((err) => expect(err).toBe(abortError));

    for (let i = 0; i < defaultConfigs.attempts + 1; i += 1) {
      await flushPromises();
      jest.runAllTimers();
      if (i === NUM_OF_POLLS_PRIOR_FIRING_STOP_POLL - 1) {
        stopPoll();
      }
    }

    expect(axios.get).toHaveBeenCalledTimes(
      NUM_OF_POLLS_PRIOR_FIRING_STOP_POLL,
    );
  });
});
