export type ApplicationReceipt = {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
};

export type InterviewNotice = {
  interviewerEmail: string;
  candidateName: string;
  jobTitle: string;
  scheduledAt: string;
};

export type OfferNotice = {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  status: string;
};

export interface NotificationAdapter {
  applicationReceived(receipt: ApplicationReceipt): Promise<void>;
  interviewScheduled(notice: InterviewNotice): Promise<void>;
  offerUpdated(notice: OfferNotice): Promise<void>;
}

const consoleAdapter: NotificationAdapter = {
  async applicationReceived(receipt) {
    console.log(
      `[notify] application received: ${receipt.candidateName} <${receipt.candidateEmail}> for ${receipt.jobTitle}`,
    );
  },
  async interviewScheduled(notice) {
    console.log(
      `[notify] interview scheduled: ${notice.interviewerEmail} with ${notice.candidateName} on ${notice.scheduledAt}`,
    );
  },
  async offerUpdated(notice) {
    console.log(
      `[notify] offer ${notice.status}: ${notice.candidateName} <${notice.candidateEmail}> for ${notice.jobTitle}`,
    );
  },
};

export const notifications: NotificationAdapter = consoleAdapter;
