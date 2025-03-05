import { apiRpc, getApiClient, InferRequestType } from "./client";

const $saveUserTask = apiRpc["user-tasks"].$post;

export type SaveUserTaskParams = InferRequestType<typeof $saveUserTask>["json"];

/**
 * Save a user task
 */
export async function saveUserTask(params: SaveUserTaskParams) {
  const client = await getApiClient();
  const response = await client["user-tasks"].$post({ json: params });
  return response.json();
}

/**
 * Get tasks by owner address
 */
export async function getTasksByOwner(userAddress: string) {
  const client = await getApiClient();
  const response = await client["user-tasks"][":userAddress"].$get({
    param: { userAddress }
  });
  return response.json();
} 