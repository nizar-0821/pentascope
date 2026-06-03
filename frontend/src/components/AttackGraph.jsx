import React, { useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { SEV } from '../utils';

export function AttackGraph({ results }) {
  const fgRef = useRef();
  const targetUrl = results?.target || "Target";
  const endpoints = results?.endpoints || [];
  const vulns = [...(results?.vulnerabilities || []), ...(results?.missing_headers || [])];

  const nodes = [{ id: "Target", name: targetUrl, group: "target", val: 6, color: "#58a6ff" }];
  const links = [];
  const epNodes = new Set();

  endpoints.forEach(ep => {
    const epName = ep.url;
    if (!epNodes.has(epName)) {
      epNodes.add(epName);
      try {
        nodes.push({ id: epName, name: new URL(epName, "http://localhost").pathname, group: "endpoint", val: 4, color: "#8b949e" });
      } catch (e) {
        nodes.push({ id: epName, name: epName, group: "endpoint", val: 4, color: "#8b949e" });
      }
      links.push({ source: "Target", target: epName });
    }
    ep.params?.forEach(p => {
      const pId = `${epName}?${p}`;
      nodes.push({ id: pId, name: p, group: "param", val: 2, color: "#484f58" });
      links.push({ source: epName, target: pId });
    });
  });

  vulns.forEach((v, i) => {
    const vId = `vuln_${i}`;
    nodes.push({ id: vId, name: v.type, group: "vuln", val: 4, color: SEV[v.severity]?.color || "#ff4d4f" });

    let targetNode = "Target";
    if (v.url && v.param) targetNode = `${v.url}?${v.param}`;
    else if (v.url) targetNode = v.url;

    if (!nodes.find(n => n.id === targetNode)) {
      nodes.push({ id: targetNode, name: targetNode.replace(/^.*\/\/[^/]+/, ''), group: "implicit", val: 2, color: "#8b949e" });
      links.push({ source: "Target", target: targetNode });
    }

    links.push({ source: targetNode, target: vId, color: SEV[v.severity]?.color || "#ff4d4f" });
  });

  return (
    <div style={{ height: 600, width: "100%", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeRelSize={6}
        linkColor={l => l.color || "rgba(255,255,255,0.1)"}
        backgroundColor="transparent"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => d.color ? 0.01 : 0.005}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current && fgRef.current.zoomToFit(400, 50)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px -apple-system, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

          ctx.fillStyle = 'rgba(15, 17, 26, 0.8)';
          ctx.beginPath();
          ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 4 / globalScale);
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);
          node.__bckgDimensions = bckgDimensions;
        }}
      />
    </div>
  );
}
