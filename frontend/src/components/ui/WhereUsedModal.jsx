import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Layers, Network } from 'lucide-react';
import Modal from '../Modal';

export default function WhereUsedModal({ isOpen, onClose, configType, itemId, itemName }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [impactData, setImpactData] = useState(null);

  useEffect(() => {
    if (!isOpen || !configType || !itemId) return;
    setLoading(true);
    Promise.all([
      axios.get(`http://127.0.0.1:8000/api/core/ui-where-used/?config_type=${configType}&item_id=${itemId}`),
      axios.get(`http://127.0.0.1:8000/api/core/ui-config-impact/?config_type=${configType}&item_id=${itemId}`)
    ])
      .then(([usedResponse, impactResponse]) => {
        setData(usedResponse.data);
        setImpactData(impactResponse.data);
      })
      .catch(() => {
        setData(null);
        setImpactData(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, configType, itemId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Where Used & Impact">
      <div className="dependency-dialog">
        <div className="dependency-heading">
          <span className="page-header-icon"><Network /></span>
          <div>
            <p className="workspace-kicker">Dependency analysis</p>
            <p className="helper-text">Tracing live references for {itemName || itemId}</p>
          </div>
        </div>

        {loading ? (
          <div className="dependency-loading">
            <span className="spinner" aria-hidden="true" />
            <p>Calculating dependencies and application impact...</p>
          </div>
        ) : (
          <>
            <section>
              <h4 className="dependency-section-title"><Layers /> Configuration impact</h4>
              <div className="dependency-stats">
                <div><small>Total impact</small><strong>{impactData?.total_impact || 0}</strong><span>components</span></div>
                <div><small>Active references</small><strong>{data?.total_references || 0}</strong><span>links</span></div>
                <div><small>Configuration type</small><strong className="dependency-type">{configType}</strong><span>selected item</span></div>
              </div>
            </section>

            <section>
              <h4 className="dependency-section-title"><CheckCircle /> Direct dependencies</h4>
              {data?.used_in?.length ? (
                <div className="dependency-list">
                  {data.used_in.map((item, index) => (
                    <div key={`${item.type}-${item.name}-${index}`}>
                      <span className="status-badge status-info">{item.type}</span>
                      <strong>{item.name}</strong>
                      <small>Module: {item.module}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state-compact">No active dependencies found. This item is safe to modify or delete.</div>}
            </section>

            <div className="dependency-panels">
              <section>
                <h4>Affected real pages</h4>
                {(impactData?.affected_pages || []).map((page) => <p key={page}><CheckCircle /> {page}</p>)}
                {!impactData?.affected_pages?.length && <p className="dependency-warning-text">No real-page consumer is connected.</p>}
              </section>
              <section>
                <h4>Affected components</h4>
                <div className="dependency-tags">
                  {(impactData?.affected_components || []).map((component) => <span key={component}>{component}</span>)}
                  {!impactData?.affected_components?.length && <span>None detected</span>}
                </div>
              </section>
            </div>

            <div className={`dependency-notice ${impactData?.connected_to_live_pages ? 'is-connected' : 'is-warning'}`}>
              <AlertTriangle />
              <div>
                <strong>{impactData?.connected_to_live_pages ? 'Live configuration verified' : 'Configuration warning'}</strong>
                <p>{impactData?.connected_to_live_pages
                  ? 'This configuration is connected to the real pages and components listed above.'
                  : 'This configuration has no real-page consumer. Connect it before treating the setting as active.'}</p>
              </div>
            </div>
          </>
        )}

        <div className="modal-footer dependency-footer"><button type="button" className="btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </Modal>
  );
}
