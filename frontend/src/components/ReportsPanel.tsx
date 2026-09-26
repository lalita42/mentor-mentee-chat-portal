import { useCallback, useEffect, useState } from "react";

import {
  getReports,
  resolveReport,
  type Report,
} from "../services/api";

function ReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReports();

      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("GET REPORTS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reports",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (reportId: string) => {
    try {
      setResolvingId(reportId);
      setError("");

      await resolveReport(reportId);

      setReports((previousReports) =>
        previousReports.map((report) =>
          report._id === reportId
            ? {
                ...report,
                resolved: true,
              }
            : report,
        ),
      );
    } catch (err) {
      console.error("RESOLVE REPORT ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to resolve report",
      );
    } finally {
      setResolvingId(null);
    }
  };

  const getReporter = (report: Report) => {
    if (
      typeof report.reporterId === "object" &&
      report.reporterId
    ) {
      return report.reporterId;
    }

    return null;
  };

  const getMessage = (report: Report) => {
    if (
      typeof report.messageId === "object" &&
      report.messageId
    ) {
      return report.messageId;
    }

    return null;
  };

  const pendingReports = reports.filter(
    (report) => !report.resolved,
  );

  const resolvedReports = reports.filter(
    (report) => report.resolved,
  );

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1>Reports Panel</h1>
            <p>Manage reported messages</p>
          </div>
        </div>

        <div className="reports-loading">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* HEADER */}

      <div className="reports-header">
        <div>
          <h1>Reports Panel</h1>

          <p>
            Review and manage messages reported by users.
          </p>
        </div>

        <button
          type="button"
          className="reports-refresh-btn"
          onClick={loadReports}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="reports-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* STATS */}

      <div className="reports-stats">
        <div className="report-stat-card">
          <div className="report-stat-icon">
            🚨
          </div>

          <div>
            <span>Total Reports</span>
            <strong>{reports.length}</strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon">
            ⚠️
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingReports.length}</strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon">
            ✓
          </div>

          <div>
            <span>Resolved</span>
            <strong>{resolvedReports.length}</strong>
          </div>
        </div>
      </div>

      {/* REPORT LIST */}

      <div className="reports-section">
        <div className="reports-section-header">
          <div>
            <h2>Reported Messages</h2>

            <p>
              Review the reason and reporter information.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">
              ✓
            </div>

            <h3>No reports found</h3>

            <p>
              There are currently no reported messages.
            </p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => {
              const reporter = getReporter(report);
              const message = getMessage(report);

              return (
                <div
                  className={`report-card ${
                    report.resolved
                      ? "report-card-resolved"
                      : ""
                  }`}
                  key={report._id}
                >
                  {/* REPORT CARD HEADER */}

                  <div className="report-card-header">
                    <div className="report-title">
                      <span className="report-warning">
                        ⚠️
                      </span>

                      <div>
                        <h3>
                          Report #{report._id.slice(-6)}
                        </h3>

                        <span className="report-date">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`report-status ${
                        report.resolved
                          ? "resolved"
                          : "pending"
                      }`}
                    >
                      {report.resolved
                        ? "✓ Resolved"
                        : "● Pending"}
                    </div>
                  </div>

                  {/* BODY */}

                  <div className="report-card-body">
                    {/* REASON */}

                    <div className="report-info-block">
                      <span className="report-label">
                        Report Reason
                      </span>

                      <div className="report-reason">
                        {report.reason}
                      </div>
                    </div>

                    {/* MESSAGE */}

                    <div className="report-info-block">
                      <span className="report-label">
                        Reported Message
                      </span>

                      <div className="reported-message">
                        {message ? (
                          <>
                            <div className="reported-message-content">
                              {message.deleted ? (
                                <span className="deleted-message">
                                  This message has been deleted.
                                </span>
                              ) : (
                                message.content ||
                                "No message content"
                              )}
                            </div>

                            <div className="reported-message-meta">
                              <span>
                                Type:{" "}
                                {message.type || "TEXT"}
                              </span>

                              {message.createdAt && (
                                <span>
                                  Sent:{" "}
                                  {formatDate(
                                    message.createdAt,
                                  )}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="missing-message">
                            Message information unavailable
                          </span>
                        )}
                      </div>
                    </div>

                    {/* REPORTER */}

                    <div className="report-info-block">
                      <span className="report-label">
                        Reported By
                      </span>

                      {reporter ? (
                        <div className="reporter-info">
                          <div className="reporter-avatar">
                            {reporter.name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </div>

                          <div>
                            <strong>
                              {reporter.name}
                            </strong>

                            <span>
                              {reporter.email}
                            </span>

                            <small>
                              {reporter.role}
                            </small>
                          </div>
                        </div>
                      ) : (
                        <span className="missing-message">
                          Reporter information unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="report-card-footer">
                    <span className="report-id">
                      ID: {report._id}
                    </span>

                    {!report.resolved && (
                      <button
                        type="button"
                        className="resolve-report-btn"
                        disabled={
                          resolvingId === report._id
                        }
                        onClick={() =>
                          handleResolve(report._id)
                        }
                      >
                        {resolvingId === report._id
                          ? "Resolving..."
                          : "✓ Mark as Resolved"}
                      </button>
                    )}

                    {report.resolved && (
                      <span className="resolved-label">
                        ✓ Report resolved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) {
    return "Unknown date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString();
}

export default ReportsPanel;