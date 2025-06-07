'use client'

import { useEffect, useState } from 'react'
import { api, Order } from '@/services/api'

export default function ContentArea() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getRecentOrders()
        setOrders(data)
      } catch (err) {
        setError('Failed to load recent orders')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="content-area">
      {/* Recent Orders Section */}
      <section className="section">
        <h2 className="section-title">Recent Orders</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((order) => (
                <tr key={order}>
                  <td>#ORD-{order.toString().padStart(4, '0')}</td>
                  <td>Customer {order}</td>
                  <td>
                    <span className="status-badge completed">Completed</span>
                  </td>
                  <td>${(Math.random() * 1000).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="section">
        <h2 className="section-title">Analytics Overview</h2>
        <div className="analytics-grid">
          <div className="chart-container">
            <div className="chart-placeholder">Chart Placeholder</div>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">Chart Placeholder</div>
          </div>
        </div>
      </section>
    </div>
  )
} 