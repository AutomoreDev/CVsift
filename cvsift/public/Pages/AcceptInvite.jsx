import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '../components/Toast';
import { Users, CheckCircle2, XCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [inviteId] = useState(searchParams.get('inviteId'));
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInviteData();
  }, [inviteId]);

  const loadInviteData = async () => {
    try {
      setLoading(true);
      setError(null);

      const functions = getFunctions();
      const getInviteData = httpsCallable(functions, 'getInviteData');

      const result = await getInviteData({ inviteId });

      if (result.data.success) {
        setInviteData(result.data.invite);
      } else {
        setError(result.data.message || 'Invalid or expired invitation');
      }
    } catch (err) {
      console.error('Error loading invite:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!currentUser) {
      toast.error('Please sign in to accept this invitation');
      navigate(`/login?redirect=/accept-invite?inviteId=${inviteId}`);
      return;
    }

    try {
      setAccepting(true);

      const functions = getFunctions();
      const acceptTeamInvite = httpsCallable(functions, 'acceptTeamInvite');

      const result = await acceptTeamInvite({ inviteId });

      if (result.data.success) {
        setSuccess(true);
        toast.success('Successfully joined the team!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      toast.error(err.message || 'Failed to accept invitation');
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvite = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-amber-50 to-accent-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="animate-spin mx-auto text-accent-500 mb-4" size={48} />
          <p className="text-gray-600 font-semibold">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-3 font-heading">Welcome to the Team!</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined the team. Redirecting to dashboard...
          </p>
          <div className="flex items-center justify-center gap-2 text-accent-500">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-semibold">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-3 font-heading">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-amber-50 to-accent-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-accent-500 to-amber-500 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="text-accent-500" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-heading">Team Invitation</h1>
          <p className="text-accent-100">You've been invited to join a CVSift team</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Invitation Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">Invitation Details</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">From:</span>
                <span className="text-secondary-900 font-bold">{inviteData?.teamOwnerName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Role:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  inviteData?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {inviteData?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-secondary-900 font-semibold">{inviteData?.email}</span>
              </div>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2 font-heading">
              <AlertCircle size={18} className="text-accent-500" />
              What you'll be able to do:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>View and search the team's CV database</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Upload new CVs to the library</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Match candidates to job specifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Access advanced analytics and insights</span>
              </li>
              {inviteData?.role === 'admin' && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold text-purple-700">Manage team members and settings</span>
                </li>
              )}
            </ul>
          </div>

          {/* Sign In Notice */}
          {!currentUser && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-yellow-900 font-semibold mb-1">Sign in required</p>
                  <p className="text-yellow-700 text-sm">
                    You'll need to sign in or create an account with <strong>{inviteData?.email}</strong> to accept this invitation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDeclineInvite}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              Decline
            </button>

            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Accepting...
                </>
              ) : (
                <>
                  Accept Invitation
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
