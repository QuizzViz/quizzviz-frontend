import { FiUsers } from 'react-icons/fi';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4">
            <FiUsers className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Teams Coming Soon</h3>
          <p className="mt-1 text-gray-500">We're working on bringing you an amazing team management experience.</p>
        </div>
      </div>
    </div>
  );
}
