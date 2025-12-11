Here is a basic example of a TypeScript repository for job scheduling. This repository includes methods for creating, reading, updating, and deleting job schedules. It also includes parameterized queries and tenant_id.


import { EntityRepository, Repository } from 'typeorm';
import { JobSchedule } from '../entities/job-schedule.entity';

@EntityRepository(JobSchedule)
export class JobSchedulingRepository extends Repository<JobSchedule> {
  async createJobSchedule(tenant_id: string, jobScheduleData: any): Promise<JobSchedule> {
    const jobSchedule = this.create({
      ...jobScheduleData,
      tenant_id,
    });

    await this.save(jobSchedule);
    return jobSchedule;
  }

  async getJobSchedules(tenant_id: string): Promise<JobSchedule[]> {
    return this.find({ where: { tenant_id } });
  }

  async getJobScheduleById(tenant_id: string, id: string): Promise<JobSchedule> {
    return this.findOne({ where: { id, tenant_id } });
  }

  async updateJobSchedule(tenant_id: string, id: string, jobScheduleData: any): Promise<JobSchedule> {
    await this.update({ id, tenant_id }, jobScheduleData);
    return this.getJobScheduleById(tenant_id, id);
  }

  async deleteJobSchedule(tenant_id: string, id: string): Promise<void> {
    await this.delete({ id, tenant_id });
  }
}


This repository is using TypeORM, a popular ORM that can run in NodeJS and others, and can be used with TypeScript and JavaScript (ES5, ES6, ES7, ES8). 

This repository is designed to be used with a job scheduling entity, which would represent a job schedule in your application. The tenant_id is used to scope all operations to a specific tenant. 

Please note that you would need to replace `JobSchedule` and `job-schedule.entity` with your actual Job Schedule entity and its location.