import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { userTasksService } from "./user-tasks.service";

// Create zod schema for request validation
const saveUserTaskSchema = z.object({
  userAddress: z.string().min(1),
  taskId: z.string().min(1),
  blockNumber: z.number().int().positive(),
});

export const userTasksRoutes = new Hono()
  // Route to save a new user task
  .post("/", zValidator("json", saveUserTaskSchema), async (c) => {
    const data = c.req.valid("json");
    const result = await userTasksService.saveUserTask(data);
    return c.json(result);
  })
  
  // Route to get tasks by owner
  .get("/:userAddress", async (c) => {
    const userAddress = c.req.param("userAddress");
    const tasks = await userTasksService.getTasksByOwner(userAddress);
    return c.json(tasks);
  }); 