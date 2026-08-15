/* ─── User Management ────────────────────────────────────── */
async function render_user_mgmt(el) {
    el.innerHTML = '<div class="loading">Loading user data…</div>';
    try {
        const res = await fetch('/api/modules/users');
        const d = await res.json();

        const users = d.users || [];
        const activeUsers = users.filter(u => u.status === 'active');
        const inactiveUsers = users.filter(u => u.status === 'inactive');
        const roles = [...new Set(users.map(u => u.role))];
        const roleCounts = {};
        users.forEach(u => { roleCounts[u.role || 'viewer'] = (roleCounts[u.role || 'viewer'] || 0) + 1; });

        // Collect all unique permissions
        const allPerms = [...new Set(users.flatMap(u => u.permissions || []))].sort();

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>👥 User Management</h2>
            <p>User accounts, roles, permissions, and access control administration</p>
            <div class="hdr-meta">
                <span>👥 ${users.length} users</span>
                <span>🟢 ${activeUsers.length} active</span>
                <span>🎭 ${roles.length} roles</span>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="card-grid g4">
            <div class="stat-card s-blue" style="border-left:3px solid ${C.info}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">👥</div><div class="stat-label">Total Users</div></div>
                    <div style="font-size:28px;opacity:0.15">👥</div>
                </div>
                <div class="stat-value" style="color:${C.info};font-size:32px;margin:4px 0">${users.length}</div>
                <div class="stat-sub">${roles.length} roles defined</div>
                <div class="progress mt-2"><div class="fill" style="width:100%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
            </div>
            <div class="stat-card s-green" style="border-left:3px solid ${C.success}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">✅</div><div class="stat-label">Active Users</div></div>
                    <div style="font-size:28px;opacity:0.15">✅</div>
                </div>
                <div class="stat-value" style="color:${C.success};font-size:32px;margin:4px 0">${activeUsers.length}</div>
                <div class="stat-sub">Currently online</div>
                <div class="progress mt-2"><div class="fill" style="width:${users.length?Math.min(100,activeUsers.length/users.length*100):0}%;background:${C.success}"></div></div>
            </div>
            <div class="stat-card s-orange" style="border-left:3px solid ${C.orange}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">🎭</div><div class="stat-label">Roles</div></div>
                    <div style="font-size:28px;opacity:0.15">🎭</div>
                </div>
                <div class="stat-value" style="color:${C.orange};font-size:32px;margin:4px 0">${roles.length}</div>
                <div class="stat-sub">${roles.join(', ')}</div>
            </div>
            <div class="stat-card s-red" style="border-left:3px solid ${C.danger}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">⛔</div><div class="stat-label">Inactive</div></div>
                    <div style="font-size:28px;opacity:0.15">⛔</div>
                </div>
                <div class="stat-value" style="color:${inactiveUsers.length ? C.danger : C.success};font-size:32px;margin:4px 0">${inactiveUsers.length}</div>
                <div class="stat-sub">${inactiveUsers.length ? 'Need review' : 'All active'}</div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="card mt-3">
            <div class="card-header">
                <h3>👥 User Accounts</h3>
                <span class="badge b-info">${users.length} users</span>
            </div>
            <div class="tbl-scroll" style="max-height:400px">
                <table class="tbl">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Permissions</th></tr>
                    </thead>
                    <tbody>
                    ${users.map(u => `
                        <tr>
                            <td style="font-weight:600">${u.name || '-'}</td>
                            <td style="font-size:12px;color:var(--text-muted)">${u.email || '-'}</td>
                            <td><span class="badge ${u.role==='admin'?'b-danger':u.role==='analyst'?'b-info':u.role==='viewer'?'b-success':'b-yellow'}" style="font-size:10px;text-transform:capitalize">${u.role || 'viewer'}</span></td>
                            <td><span style="color:${u.status==='active'?C.success:C.danger}">${u.status==='active'?'● Active':'● Inactive'}</span></td>
                            <td style="font-size:12px;color:var(--text-muted)">${u.last_login ? timeAgo(u.last_login) : 'Never'}</td>
                            <td>${(u.permissions||[]).slice(0,3).map(p => `<span class="badge b-success" style="font-size:9px;margin:1px">${p}</span>`).join('')}${(u.permissions||[]).length > 3 ? `<span class="badge b-info" style="font-size:9px">+${u.permissions.length-3}</span>` : ''}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px">No users found</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Role Distribution & Permissions Matrix -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>🎭 Role Distribution</h3>
                </div>
                <div style="height:260px;padding:8px"><canvas id="umgmt-role-chart"></canvas></div>
                <div style="padding:0 16px 16px">
                    ${Object.entries(roleCounts).sort((a,b)=>b[1]-a[1]).map(([role,cnt])=>{
                        const colors = {admin:C.danger,analyst:C.info,viewer:C.success,editor:C.purple,moderator:C.orange};
                        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
                            <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${colors[role]||C.info};margin-right:6px"></span>${role}</span>
                            <span style="font-weight:600">${cnt} user${cnt!==1?'s':''}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>🔑 Permissions Matrix</h3>
                    <span class="badge b-success">${allPerms.length} permissions</span>
                </div>
                <div class="tbl-scroll" style="max-height:380px">
                    <table class="tbl">
                        <thead>
                            <tr><th>Permission</th>${roles.map(r => `<th style="text-align:center;text-transform:capitalize">${r}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                        ${allPerms.map(perm => `
                            <tr>
                                <td style="font-size:12px;font-weight:500">${perm}</td>
                                ${roles.map(r => {
                                    const hasPerm = users.some(u => u.role === r && (u.permissions||[]).includes(perm));
                                    return `<td style="text-align:center;color:${hasPerm?C.success:C.muted}">${hasPerm?'✓':'✗'}</td>`;
                                }).join('')}
                            </tr>
                        `).join('') || '<tr><td colspan="'+(roles.length+1)+'" style="text-align:center;color:var(--text-muted);padding:30px">No permissions defined</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            const rc = document.getElementById('umgmt-role-chart');
            if (rc) {
                const roleColors = {admin:C.danger,analyst:C.info,viewer:C.success,editor:C.purple,moderator:C.orange};
                makeDoughnut(rc.getContext('2d'), Object.keys(roleCounts).map(r => r.charAt(0).toUpperCase() + r.slice(1)),
                    Object.values(roleCounts), Object.keys(roleCounts).map(r => roleColors[r] || C.info));
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error loading user data: ' + e.message + '</div>'; }
}
