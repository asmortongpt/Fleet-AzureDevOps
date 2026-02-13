import { ZodError, z } from 'zod';

import logger from '../config/logger';

interface VersionVector {
  taskId: string;
  userId: string;
  version: number;
}

const versionVectorSchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  version: z.number().min(0),
});

class ConflictResolutionService {
  private versionVectors: Map<string, VersionVector> = new Map();

  /**
   * Validates the incoming version vector against the schema.
   * @param data - The version vector data to validate.
   * @returns A validated version vector object.
   * @throws {ZodError} If validation fails.
   */
  private validateVersionVector(data: any): VersionVector {
    try {
      return versionVectorSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error('Validation error in version vector', { errors: (error as any).errors });
        throw new Error('Invalid version vector data.');
      }
      throw error;
    }
  }

  /**
   * Checks if the incoming event can be applied based on its version vector.
   * @param incomingVector - The version vector of the incoming event.
   * @returns A boolean indicating if the event can be applied.
   */
  canApplyEvent(incomingVector: any): boolean {
    try {
      const validatedVector = this.validateVersionVector(incomingVector);
      const key = `${validatedVector.taskId}-${validatedVector.userId}`;
      const currentVector = this.versionVectors.get(key);

      if (!currentVector || currentVector.version < validatedVector.version) {
        this.versionVectors.set(key, validatedVector);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error in canApplyEvent', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Resets the version vector for a specific task and user.
   * This is useful when a task is deleted or reassigned.
   * @param taskId - The ID of the task.
   * @param userId - The ID of the user.
   */
  resetVersionVector(taskId: string, userId: string): void {
    try {
      const key = `${taskId}-${userId}`;
      this.versionVectors.delete(key);
    } catch (error) {
      logger.error('Error in resetVersionVector', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export default ConflictResolutionService;