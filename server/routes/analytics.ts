
import { storage } from "../storage";
import { requireAdmin } from "../auth";
import type { Express } from "express";

// Helper to calculate Linear Regression
function calculateTrend(data: number[]) {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

export function registerAnalyticsRoutes(app: Express) {
    app.get("/api/admin/analytics/forecast", requireAdmin, async (_req, res) => {
        try {
            const history = await storage.getSalesHistory(30); // Get last 30 days
            const revenues = history.map(h => h.revenue);
            const { slope, intercept } = calculateTrend(revenues);

            const forecast = [];
            const today = new Date();

            // Generate next 30 days forecast
            for (let i = 0; i < 30; i++) {
                const nextDate = new Date(today);
                nextDate.setDate(today.getDate() + i + 1);

                // x = 30 + i (since history is 0-29)
                const x = 30 + i;
                const predictedRevenue = Math.max(0, slope * x + intercept); // No negative revenue

                forecast.push({
                    date: nextDate.toISOString().split('T')[0],
                    revenue: Math.round(predictedRevenue * 100) / 100
                });
            }

            res.json({ history, forecast, trend: { slope, intercept } });
        } catch (error) {
            console.error("Forecast error:", error);
            res.status(500).json({ message: "Error calculating forecast" });
        }
    });

    app.get("/api/admin/analytics/abc", requireAdmin, async (_req, res) => {
        try {
            const stats = await storage.getProductRevenueStats();
            const totalRevenue = stats.reduce((sum, item) => sum + item.revenue, 0);

            let cumulativeRevenue = 0;
            const classified = stats.map(item => {
                cumulativeRevenue += item.revenue;
                const percentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

                let category = 'C';
                if (percentage <= 80) category = 'A';
                else if (percentage <= 95) category = 'B';

                return { ...item, category, percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0 };
            });

            res.json({
                totalRevenue,
                items: classified,
                distribution: {
                    A: classified.filter(c => c.category === 'A').length,
                    B: classified.filter(c => c.category === 'B').length,
                    C: classified.filter(c => c.category === 'C').length,
                }
            });
        } catch (error) {
            console.error("ABC Analysis error:", error);
            res.status(500).json({ message: "Error calculating ABC analysis" });
        }
    });

    app.get("/api/admin/analytics/dead-stock", requireAdmin, async (req, res) => {
        try {
            const days = parseInt(req.query.days as string) || 90;
            const deadStock = await storage.getInactiveProducts(days);
            res.json(deadStock);
        } catch (error) {
            console.error("Dead Stock error:", error);
            res.status(500).json({ message: "Error fetching dead stock" });
        }
    });

    app.get("/api/admin/analytics/stats/orders", requireAdmin, async (req, res) => {
        try {
            const stats = await storage.getDashboardActivity();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Error fetching dashboard stats" });
        }
    });
}
