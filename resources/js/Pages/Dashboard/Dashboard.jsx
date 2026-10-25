import Sidebar from '@/Components/Sidebar';
import React from 'react';


export default function Dashboard() {
  return (
    <div>
      <Sidebar/>
      <div className="p-7">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
    </div>
  );
}