import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../js/firebase-config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Users, Mail, Trash2, UserPlus, Crown, Shield, User as UserIcon, Check, X, Loader2, AlertCircle, Activity } from 'lucide-react';
import { useToast } from './Toast';
import { hasFeatureAccess } from '../config/planConfig';
import ConfirmDialog from './ConfirmDialog';
import ActivityLog from './ActivityLog';

export default function TeamCollaboration() {
  const { currentUser, userData } = useAuth();
  const toast = useToast();
  const userPlan = userData?.plan || 'free';

  const [activeSubTab, setActiveSubTab] = useState('invite');
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, memberId: null, memberEmail: '' });
  const [teamOwnerData, setTeamOwnerData] = useState(null);

  // Check if current user is a team member (not owner)
  const isTeamMember = userData?.teamAccess?.isTeamMember;
  const teamOwnerId = userData?.teamAccess?.teamOwnerId;

  const hasAccess = hasFeatureAccess(userPlan, 'teamCollaboration');

  // Get team size limits based on plan
  const getTeamLimit = () => {
    switch (userPlan) {
      case 'professional': return 3;
      case 'business': return 10;
      case 'enterprise': return 999; // Unlimited
      default: return 1; // Solo
    }
  };

  const teamLimit = getTeamLimit();

  useEffect(() => {
    if (currentUser && hasAccess) {
      loadTeamData();
    } else {
      setLoading(false);
    }
  }, [currentUser, hasAccess]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // If user is a team member, load the owner's team data
      const effectiveOwnerId = isTeamMember ? teamOwnerId : currentUser.uid;

      // If team member, fetch the owner's data
      if (isTeamMember && teamOwnerId) {
        const ownerDoc = await getDoc(doc(db, 'users', teamOwnerId));
        if (ownerDoc.exists()) {
          setTeamOwnerData({
            uid: teamOwnerId,
            ...ownerDoc.data()
          });
        }
      }

      // Load team members
      const membersQuery = query(
        collection(db, 'teamMembers'),
        where('teamOwnerId', '==', effectiveOwnerId)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamMembers(members);

      // Load pending invites (only for owner, not team members)
      if (!isTeamMember) {
        const invitesQuery = query(
          collection(db, 'teamInvites'),
          where('invitedBy', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const invitesSnapshot = await getDocs(invitesQuery);
        const invites = invitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingInvites(invites);
      }

    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Check if already at limit
    const totalMembers = teamMembers.length + pendingInvites.length + 1; // +1 for owner
    if (totalMembers >= teamLimit) {
      toast.error(`Your ${userPlan} plan supports up to ${teamLimit} team member${teamLimit > 1 ? 's' : ''}. Upgrade to add more.`);
      return;
    }

    // Check if already a member or invited
    if (teamMembers.some(m => m.email === inviteEmail)) {
      toast.error('This user is already a team member');
      return;
    }

    if (pendingInvites.some(i => i.email === inviteEmail)) {
      toast.error('An invitation has already been sent to this email');
      return;
    }

    try {
      setSending(true);

      // Call cloud function to send invite
      const functions = getFunctions();
      const sendTeamInvite = httpsCallable(functions, 'sendTeamInvite');

      const result = await sendTeamInvite({
        email: inviteEmail,
        role: inviteRole,
        teamOwnerName: userData?.displayName || currentUser.email
      });

      if (result.data.success) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('member');
        await loadTeamData();
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await deleteDoc(doc(db, 'teamInvites', inviteId));
      toast.success('Invitation cancelled');
      await loadTeamData();
    } catch (error) {
      console.error('Error cancelling invite:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRemoveMember = (memberId, memberEmail) => {
    setDeleteDialog({
      isOpen: true,
      memberId: memberId,
      memberEmail: memberEmail
    });
  };

  const confirmRemoveMember = async () => {
    try {
      const functions = getFunctions();
      const removeTeamMember = httpsCallable(functions, 'removeTeamMember');

      await removeTeamMember({ memberId: deleteDialog.memberId });

      toast.success('Team member removed');
      setDeleteDialog({ isOpen: false, memberId: null, memberEmail: '' });
      await loadTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const functions = getFunctions();
      const updateTeamMemberRole = httpsCallable(functions, 'updateTeamMemberRole');

      const result = await updateTeamMemberRole({ memberId, newRole });

      if (result.data.success) {
        toast.success(`Member role updated to ${newRole}`);
        await loadTeamData();
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error(error.message || 'Failed to update member role');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown size={16} className="text-accent-500" />;
      case 'admin': return <Shield size={16} className="text-blue-500" />;
      default: return <UserIcon size={16} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: 'bg-accent-100 text-accent-700 border-accent-200',
      admin: 'bg-blue-100 text-blue-700 border-blue-200',
      member: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return badges[role] || badges.member;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-accent-500" size={32} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-accent-50 to-amber-50 border-2 border-accent-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Users className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-secondary-900 mb-2 font-heading">Team Collaboration</h3>
            <p className="text-gray-700 mb-4">
              Collaborate with your team by inviting members to access your CVSift account. Share CVs, job specs, and work together seamlessly.
            </p>
            <div className="bg-white border border-accent-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-accent-900 mb-2">Available on:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Professional: Up to 3 team members
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Business: Up to 10 team members
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Enterprise: Unlimited team members
                </li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Upgrade to Professional
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 font-heading">Team Collaboration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Invite team members to collaborate • {teamMembers.length + 1} of {teamLimit === 999 ? '∞' : teamLimit} members
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-100 to-amber-100 text-accent-700 rounded-full text-sm font-semibold border border-accent-200">
          <Users size={16} />
          <span className="capitalize">{userPlan} Plan</span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b-2 border-gray-200">
          <button
            onClick={() => setActiveSubTab('invite')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
              activeSubTab === 'invite'
                ? 'text-accent-500 border-b-2 border-accent-500 bg-accent-50 -mb-0.5'
                : 'text-gray-600 hover:text-secondary-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <UserPlus size={18} />
              <span>Invite & Members</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
              activeSubTab === 'activity'
                ? 'text-accent-500 border-b-2 border-accent-500 bg-accent-50 -mb-0.5'
                : 'text-gray-600 hover:text-secondary-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Activity size={18} />
              <span>Activity Log</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {/* Invite & Members Tab */}
          {activeSubTab === 'invite' && (
            <div className="space-y-6">
              {/* Show notice if team member */}
              {isTeamMember && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                      <AlertCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 font-heading">Team Member View</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Only the team owner can invite new members. You can view the team structure below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invite Form - only show for owner */}
              {!isTeamMember && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                      <UserPlus className="text-white" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary-900 font-heading">Invite Team Member</h4>
                      <p className="text-xs text-gray-600">Send an invitation via email</p>
                    </div>
                  </div>

                  <form onSubmit={handleInviteMember} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={sending}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !inviteEmail.trim()}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending Invitation...
              </>
            ) : (
              <>
                <Mail size={18} />
                Send Invitation
              </>
            )}
          </button>
        </form>
      </div>
              )}

      {/* Team Members List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-accent-50/20">
          <h4 className="font-bold text-secondary-900 flex items-center gap-2 font-heading">
            <Users size={18} className="text-accent-500" />
            Team Members ({teamMembers.length + 1})
          </h4>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Owner (show team owner if team member, otherwise current user) */}
          <div className="px-6 py-4 flex items-center justify-between bg-accent-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {isTeamMember
                  ? (teamOwnerData?.displayName?.charAt(0) || teamOwnerData?.email?.charAt(0) || 'O')
                  : (userData?.displayName?.charAt(0) || currentUser.email?.charAt(0))
                }
              </div>
              <div>
                <p className="font-semibold text-secondary-900">
                  {isTeamMember
                    ? (teamOwnerData?.displayName || teamOwnerData?.email || 'Team Owner')
                    : (userData?.displayName || 'You')
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {isTeamMember
                    ? teamOwnerData?.email
                    : currentUser.email
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getRoleBadge('owner')}`}>
                {getRoleIcon('owner')}
                Owner
              </span>
            </div>
          </div>

          {/* Team Members */}
          {teamMembers.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {member.displayName?.charAt(0) || member.email?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-secondary-900">{member.displayName || 'Team Member'}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Joined {new Date(member.joinedAt?.toDate?.() || member.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Role selector - only visible for owner */}
                {!isTeamMember ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-colors ${getRoleBadge(member.role)} hover:opacity-80`}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getRoleBadge(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                )}
                {!isTeamMember && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.email)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {teamMembers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No team members yet. Invite your first team member above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-amber-50/20">
            <h4 className="font-bold text-secondary-900 flex items-center gap-2 font-heading">
              <Mail size={18} className="text-amber-500" />
              Pending Invitations ({pendingInvites.length})
            </h4>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Mail size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900">{invite.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Invited {new Date(invite.createdAt?.toDate?.() || invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(invite.role)}`}>
                    {invite.role}
                  </span>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Cancel invitation"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Permissions Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
          <AlertCircle size={18} className="text-gray-500" />
          Role Permissions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-accent-500" />
              <span className="font-bold text-secondary-900">Owner</span>
            </div>
            <ul className="space-y-1 text-gray-600 text-xs">
              <li>• Full account access</li>
              <li>• Manage team members</li>
              <li>• Billing & subscriptions</li>
              <li>• Delete account</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-blue-500" />
              <span className="font-bold text-secondary-900">Admin</span>
            </div>
            <ul className="space-y-1 text-gray-600 text-xs">
              <li>• Create, edit & delete CVs</li>
              <li>• Create, edit & delete job specs</li>
              <li>• View all data & reports</li>
              <li>• Export CVs to CSV</li>
              <li>• Cannot manage team or billing</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon size={16} className="text-gray-500" />
              <span className="font-bold text-secondary-900">Member</span>
            </div>
            <ul className="space-y-1 text-gray-600 text-xs">
              <li>• View CVs & job specs (read-only)</li>
              <li>• Upload CVs</li>
              <li>• Search, filter & export</li>
              <li>• Match CVs to job specs</li>
              <li>• Cannot edit or delete data</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
          )}

          {/* Activity Log Tab */}
          {activeSubTab === 'activity' && (
            <ActivityLog />
          )}
        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, memberId: null, memberEmail: '' })}
        onConfirm={confirmRemoveMember}
        title="Remove Team Member?"
        message={`Are you sure you want to remove ${deleteDialog.memberEmail} from your team? They will immediately lose access to your CVSift account and all shared data.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        type="danger"
        icon={Trash2}
      />
    </div>
  );
}
