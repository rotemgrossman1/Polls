import { invitePath } from './routes';

// The full invite link: this app's own address followed by the invite path.
export function buildInviteLink(inviteCode) {
  return `${window.location.origin}${invitePath(inviteCode)}`;
}
