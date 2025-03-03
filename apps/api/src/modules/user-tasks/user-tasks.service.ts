import { db, userTasks, eq } from "@repo/db";

export interface SaveUserTaskParams {
  userAddress: string;
  taskId: string;
  blockNumber: number;
}

export const userTasksService = {
  /**
   * Save a new user task
   */
  async saveUserTask({ userAddress, taskId, blockNumber }: SaveUserTaskParams) {
    return db.insert(userTasks).values({
      userAddress,
      taskId,
      blockNumber,
    }).returning();
  },

  /**
   * Get all tasks by user address
   */
  async getTasksByOwner(userAddress: string) {
    return db.select().from(userTasks).where(
      eq(userTasks.userAddress, userAddress)
    ).orderBy(userTasks.blockNumber);
  }
}; 