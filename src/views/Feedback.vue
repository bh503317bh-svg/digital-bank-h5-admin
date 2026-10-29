<template>
  <div class="layout">
    <header>
      <div class="brand">aku-bank Admin</div>
      <nav class="nav">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/feedback" class="nav-link active">User Feedback</router-link>
      </nav>
      <div class="hdr-right">
        <span class="chip">USD</span>
        <el-button link type="danger" @click="logout">Sign out</el-button>
      </div>
    </header>
    <main v-loading="loading">
      <el-card>
        <template #header>User feedback (cm cases)</template>
        <el-table :data="rows" size="small" @row-click="openCase">
          <el-table-column prop="case_id" label="Ticket" min-width="180" />
          <el-table-column prop="case_type" label="Type" min-width="140" />
          <el-table-column prop="subject" label="Subject" min-width="200" />
          <el-table-column prop="status" label="Status" width="110" />
          <el-table-column prop="assignee" label="Assignee" width="110" />
          <el-table-column prop="user_id" label="User" width="80" />
          <el-table-column prop="created_at" label="Created" width="170" />
          <el-table-column label="" width="90">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click.stop="openCase(row)">Detail</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </main>

    <el-drawer v-model="drawer" :title="`Feedback ${current?.case_id || ''}`" size="560px">
      <div v-if="current" v-loading="detailLoading">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="Type">{{ current.case_type }}</el-descriptions-item>
          <el-descriptions-item label="Subject">{{ current.subject }}</el-descriptions-item>
          <el-descriptions-item label="Description">{{ current.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Status">{{ current.status }}</el-descriptions-item>
          <el-descriptions-item label="Priority">{{ current.priority }}</el-descriptions-item>
          <el-descriptions-item label="Assignee">{{ current.assignee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="User">{{ current.user_id }}</el-descriptions-item>
          <el-descriptions-item label="Created">{{ formatTime(current.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="Updated">{{ formatTime(current.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-h">Processing notes</div>
        <div v-if="!current.notes || !current.notes.length" class="muted">No notes yet.</div>
        <div v-else>
          <div v-for="n in current.notes" :key="n.note_id" class="note">
            <div>{{ n.body }}</div>
            <div class="muted sm">{{ formatTime(n.created_at) }} · by {{ n.author_user_id }}</div>
          </div>
        </div>

        <div class="sec-h">Reply</div>
        <el-input v-model="reply" type="textarea" :rows="3" placeholder="Reply to the customer" />
        <div class="actions">
          <el-button type="primary" :loading="replying" @click="doReply">Reply</el-button>
        </div>

        <div class="sec-h">Status</div>
        <div class="actions">
          <el-button size="small" :disabled="!can('assigned')" @click="doTransition('assigned')">Assign</el-button>
          <el-button size="small" :disabled="!can('in_progress')" @click="doTransition('in_progress')">In progress</el-button>
          <el-button size="small" :disabled="!can('resolved')" @click="doTransition('resolved')">Resolved</el-button>
          <el-button size="small" :disabled="!can('closed')" @click="doTransition('closed')">Close</el-button>
          <el-button size="small" :disabled="!can('reopened')" @click="doTransition('reopened')">Reopen</el-button>
          <el-button size="small" :disabled="!can('pending_customer')" @click="doTransition('pending_customer')">Info needed</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchFeedback, listFeedback, replyFeedback, transitionFeedback } from '../api'

const router = useRouter()
const loading = ref(false)
const all = ref([])
const drawer = ref(false)
const current = ref(null)
const detailLoading = ref(false)
const reply = ref('')
const replying = ref(false)

const WORKFLOW = {
  open: ['assigned', 'closed'],
  assigned: ['in_progress', 'open'],
  in_progress: ['pending_customer', 'resolved', 'assigned'],
  pending_customer: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['assigned', 'in_progress']
}

function can(status) {
  return !!current.value && (WORKFLOW[current.value.status] || []).includes(status)
}

const rows = computed(() =>
  (all.value || []).filter((c) => c && String(c.case_type || '').startsWith('FEEDBACK_'))
)

function formatTime(iso) {
  if (!iso) return ''
  return String(iso).replace('T', ' ').slice(0, 19)
}

async function load() {
  loading.value = true
  try {
    const res = await listFeedback()
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Failed to load feedback')
    } else {
      all.value = res.data || []
    }
  } catch {
    ElMessage.error('Upstream timeout — retry')
  } finally {
    loading.value = false
  }
}

async function openCase(row) {
  current.value = row
  drawer.value = true
  detailLoading.value = true
  try {
    const res = await fetchFeedback(row.case_id)
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Failed to load detail')
    } else {
      current.value = res.data
    }
  } catch {
    ElMessage.error('Upstream timeout — retry')
  } finally {
    detailLoading.value = false
  }
}

async function doReply() {
  const body = reply.value.trim()
  if (!body) {
    ElMessage.warning('Reply cannot be empty')
    return
  }
  replying.value = true
  try {
    const res = await replyFeedback(current.value.case_id, body)
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Reply failed')
      return
    }
    ElMessage.success('Replied')
    reply.value = ''
    current.value = res.data
    refreshList()
  } catch {
    ElMessage.error('Reply failed')
  } finally {
    replying.value = false
  }
}

async function doTransition(status) {
  try {
    const res = await transitionFeedback(current.value.case_id, status)
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Status change failed')
      return
    }
    ElMessage.success(`Status -> ${status}`)
    current.value = res.data
    refreshList()
  } catch {
    ElMessage.error('Status change failed')
  }
}

function refreshList() {
  listFeedback().then((res) => {
    if (res.code === 0) all.value = res.data || []
  })
}

function logout() {
  localStorage.removeItem('wb_admin_token')
  router.replace('/login')
}

onMounted(load)
</script>

<style scoped>
.layout { min-height: 100vh; background: #f3f6fb; }
header {
  height: 56px; background: #0b1f44; color: #fff;
  display: flex; align-items: center; gap: 20px; padding: 0 20px;
}
.brand { font-weight: 700; letter-spacing: .5px; }
.nav { display: flex; gap: 16px; flex: 1; }
.nav-link { color: rgba(255,255,255,.75); text-decoration: none; font-size: 14px; }
.nav-link.active { color: #fff; font-weight: 700; }
.hdr-right { display: flex; align-items: center; gap: 12px; }
.chip {
  font-size: 11px; font-weight: 700; letter-spacing: .04em;
  padding: 2px 8px; border-radius: 10px;
  background: rgba(255,255,255,.15); color: #fff;
}
main { padding: 20px; }
.sec-h { margin: 18px 0 8px; font-weight: 700; font-size: 14px; }
.note { padding: 8px 0; border-bottom: 1px solid #eef1f6; font-size: 13px; }
.muted { color: #8090a8; font-size: 12px; }
.muted.sm { font-size: 11px; }
.actions { margin: 10px 0 4px; display: flex; flex-wrap: wrap; gap: 8px; }
</style>
