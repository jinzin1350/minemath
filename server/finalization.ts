/**
 * Finalization Service for Temporary/Final Scoring System
 * 
 * This service handles both lazy (on-read) and scheduled (background) 
 * finalization of daily progress scores at midnight in user's timezone.
 */

import { storage } from './storage';
import { dailyProgress } from '../shared/schema';
import { db } from './db';
import { eq, and, lt } from 'drizzle-orm';

export class FinalizationService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 1000 * 60 * 5; // Check every 5 minutes

  /**
   * Start the background finalization scheduler
   */
  public startScheduler(): void {
    if (this.intervalId) {
      console.log('Finalization scheduler already running');
      return;
    }

    console.log('Starting finalization scheduler...');
    this.intervalId = setInterval(() => {
      this.runScheduledFinalization().catch(error => {
        console.error('Scheduled finalization error:', error);
      });
    }, this.CHECK_INTERVAL);

    // Run once immediately on startup
    this.runScheduledFinalization().catch(error => {
      console.error('Initial finalization error:', error);
    });
  }

  /**
   * Stop the background finalization scheduler
   */
  public stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Finalization scheduler stopped');
    }
  }

  /**
   * Lazy finalization: Check and finalize specific user's progress on-demand
   * This is called when reading progress data to ensure it's finalized if needed
   */
  public async checkAndFinalizeUser(userId: string, date: string): Promise<boolean> {
    try {
      // Check if user has unfinalized progress that should be finalized
      const progress = await db
        .select()
        .from(dailyProgress)
        .where(
          and(
            eq(dailyProgress.userId, userId),
            eq(dailyProgress.date, date),
            eq(dailyProgress.isFinal, false),
            lt(dailyProgress.finalizeAt, new Date()) // Past finalization time
          )
        )
        .limit(1);

      if (progress.length === 0) {
        return false; // Nothing to finalize
      }

      // Use storage layer method to finalize
      await storage.finalizeDueForUser(userId);
      console.log(`Lazy finalized progress for user ${userId} on ${date}`);
      return true;
    } catch (error) {
      console.error(`Lazy finalization error for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Scheduled finalization: Find and finalize all overdue progress records
   * This runs periodically in the background to catch any missed finalizations
   */
  private async runScheduledFinalization(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all unfinalized progress that should be finalized
      const overdueProgress = await db
        .select()
        .from(dailyProgress)
        .where(
          and(
            eq(dailyProgress.isFinal, false),
            lt(dailyProgress.finalizeAt, now) // Past finalization time
          )
        );

      if (overdueProgress.length === 0) {
        console.log('No overdue progress to finalize');
        return;
      }

      console.log(`Found ${overdueProgress.length} overdue progress records to finalize`);

      // Use storage layer method to finalize all overdue records
      await storage.finalizeDueAll();
      
      console.log(`Scheduled finalization completed: ${overdueProgress.length} records finalized`);
    } catch (error) {
      console.error('Scheduled finalization error:', error);
    }
  }

  /**
   * Manual cleanup: Force finalize all unfinalized progress older than specified hours
   * This is mainly for maintenance and debugging purposes
   */
  public async cleanupOldProgress(hoursOld: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
      
      const oldProgress = await db
        .select()
        .from(dailyProgress)
        .where(
          and(
            eq(dailyProgress.isFinal, false),
            lt(dailyProgress.finalizeAt, cutoffTime)
          )
        );

      if (oldProgress.length === 0) {
        return 0;
      }

      // Use storage layer method to finalize all overdue records
      await storage.finalizeDueAll();
      
      console.log(`Manual cleanup: ${oldProgress.length} old progress records finalized`);
      return oldProgress.length;
    } catch (error) {
      console.error('Manual cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get statistics about finalization status
   */
  public async getFinalizationStats(): Promise<{
    totalRecords: number;
    finalizedRecords: number;
    temporaryRecords: number;
    overdueRecords: number;
  }> {
    try {
      const now = new Date();
      
      const allProgress = await db.select().from(dailyProgress);
      
      const stats = {
        totalRecords: allProgress.length,
        finalizedRecords: allProgress.filter(p => p.isFinal).length,
        temporaryRecords: allProgress.filter(p => !p.isFinal).length,
        overdueRecords: allProgress.filter(p => !p.isFinal && p.finalizeAt && p.finalizeAt < now).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting finalization stats:', error);
      return {
        totalRecords: 0,
        finalizedRecords: 0,
        temporaryRecords: 0,
        overdueRecords: 0
      };
    }
  }
}

// Export singleton instance
export const finalizationService = new FinalizationService();