"use client";

import { useEffect, useState } from "react";

type Programme = {
  id: string;
  name: string;
  code: string;
  feeAmount: number;
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", feeAmount: "" });

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch("/api/programmes");
      const data = await response.json();
      if (data.success) setProgrammes(data.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (p?: Programme) => {
    if (p) {
      setEditingId(p.id);
      setFormData({ name: p.name, code: p.code, feeAmount: p.feeAmount.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: "", code: "", feeAmount: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", code: "", feeAmount: "" });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.feeAmount) {
      setNotification({ type: "error", message: "All fields required" });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/programmes/${editingId}` : "/api/programmes";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          feeAmount: parseFloat(formData.feeAmount),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNotification({ type: "success", message: "Saved!" });
        handleCloseModal();
        fetchProgrammes();
      } else {
        setNotification({ type: "error", message: result.error });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed" });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this programme?")) return;
    try {
      const response = await fetch(`/api/programmes/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setNotification({ type: "success", message: "Deleted!" });
        fetchProgrammes();
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed" });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Programmes & Fees</h1>
            <p className="text-sm text-gray-600 mt-1">Define programmes and set fees</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500"
          >
            + New Programme
          </button>
        </div>

        {notification && (
          <div className={`p-4 rounded-lg ${notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {notification.message}
          </div>
        )}

        {programmes.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            No programmes yet. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programmes.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow border p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500">Code: {p.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(p)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border">
                  <p className="text-xs text-gray-600">Fee Amount</p>
                  <p className="text-2xl font-bold text-indigo-600">৳{p.feeAmount.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-gray-600">Half</p>
                    <p className="font-bold text-blue-600">{(p.feeAmount / 2).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-gray-600">Full</p>
                    <p className="font-bold text-green-600">{p.feeAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{editingId ? "Edit" : "New"} Programme</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="BSc in Computer Science"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BSC-CSE"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (৳) *</label>
                <input
                  type="number"
                  value={formData.feeAmount}
                  onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                  placeholder="200000"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button onClick={handleCloseModal} className="flex-1 border rounded-lg px-4 py-2">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}