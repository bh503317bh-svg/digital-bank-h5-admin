<template>
  <div class="layout">
    <header>
      <div class="brand">aku-bank Admin</div>
      <nav class="nav">
        <router-link to="/" class="nav-link active">Dashboard</router-link>
        <router-link to="/feedback" class="nav-link">User Feedback</router-link>
      </nav>
      <div class="hdr-right">
        <span class="chip">USD</span>
        <el-button link type="danger" @click="logout">Sign out</el-button>
      </div>
    </header>
    <main v-loading="loading">
      <el-row :gutter="16">
        <el-col :span="6" v-for="c in cards" :key="c.label">
          <el-card><div class="metric">{{ c.value }}</div><div class="label">{{ c.label }}</div></el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top:16px">
        <el-col :span="8" v-for="c in domainCards" :key="c.label">
          <el-card><div class="metric sm">{{ c.value }}</div><div class="label">{{ c.label }}</div></el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top:16px" header="Customers">
        <el-table :data="data?.customers || []" size="small">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="Name" />
          <el-table-column prop="mobile" label="Mobile" />
          <el-table-column prop="kyc_status" label="KYC" />
        </el-table>
      </el-card>

      <el-card style="margin-top:16px" header="Loans (ln)">
        <el-table :data="data?.ln_loans || []" size="small">
          <el-table-column prop="loan_id" label="Loan ID" min-width="140" />
          <el-table-column prop="product_id" label="Product" min-width="120" />
          <el-table-column prop="outstanding_principal" label="Outstanding ($)" width="130" />
          <el-table-column prop="status" label="Status" width="90" />
          <el-table-column prop="overdue_days" label="DPD" width="80" />
        </el-table>
      </el-card>

      <el-card style="margin-top:16px" header="Support cases (cm)">
        <el-table :data="data?.cm_cases || []" size="small">
          <el-table-column prop="case_id" label="Case ID" min-width="140" />
          <el-table-column prop="case_type" label="Type" min-width="120" />
          <el-table-column prop="priority" label="Priority" width="90" />
          <el-table-column prop="status" label="Status" width="100" />
          <el-table-column prop="assignee" label="Assignee" width="110" />
          <el-table-column prop="subject" label="Subject" min-width="140" />
        </el-table>
      </el-card>

      <el-card style="margin-top:16px" header="Collections (cl)">
        <el-table :data="data?.cl_cases || []" size="small">
          <el-table-column prop="case_id" label="Case ID" min-width="140" />
          <el-table-column prop="loan_id" label="Loan" min-width="120" />
          <el-table-column prop="dpd" label="DPD" width="70" />
          <el-table-column prop="stage" label="Stage" width="90" />
          <el-table-column prop="status" label="Status" width="90" />
          <el-table-column prop="overdue_principal" label="Overdue ($)" width="110" />
          <el-table-column prop="strategy_code" label="Strategy" width="100" />
        </el-table>
      </el-card>

      <el-card style="margin-top:16px" header="Deposit accounts">
        <el-table :data="data?.accounts || []" size="small">
          <el-table-column prop="account_no" label="Account" />
          <el-table-column prop="balance" label="Balance ($)" />
          <el-table-column prop="currency" label="CCY" width="80" />
          <el-table-column prop="status" label="Status" width="100" />
        </el-table>
      </el-card>

      <el-card style="margin-top:16px" header="Accounting entries">
        <el-table :data="entries" size="small">
          <el-table-column prop="txn_id" label="Txn ID" />
          <el-table-column prop="side" label="Dr/Cr" width="80" />
          <el-table-column prop="account_code" label="Account / GL" />
          <el-table-column prop="amount" label="Amount ($)" width="110" />
        </el-table>
      </el-card>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { listEntries, overview } from '../api'

const loading = ref(false)
const data = ref(null)
const entries = ref([])
const router = useRouter()

const cards = computed(() => [
  { label: 'Customers', value: data.value?.customer_count ?? '-' },
  { label: 'Accounts', value: data.value?.account_count ?? '-' },
  { label: 'GL events', value: data.value?.event_count ?? '-' },
  { label: 'Total deposits ($)', value: data.value?.total_balance ?? '-' }
])

const domainCards = computed(() => [
  {
    label: 'Loans / outstanding ($)',
    value: `${data.value?.ln_portfolio?.loan_count ?? '-'} / ${data.value?.ln_portfolio?.outstanding_principal ?? '-'}`
  },
  {
    label: 'Cases / SLA breaches',
    value: `${data.value?.cm_metrics?.case_count ?? '-'} / ${data.value?.cm_metrics?.sla_breached ?? '-'}`
  },
  {
    label: 'Collections / overdue ($)',
    value: `${data.value?.cl_metrics?.case_count ?? '-'} / ${data.value?.cl_metrics?.outstanding_principal ?? '-'}`
  }
])

async function load() {
  loading.value = true
  try {
    const res = await overview()
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Failed to load overview')
      return
    }
    data.value = res.data
    const e = await listEntries()
    if (e.code === 0) entries.value = e.data || []
  } catch (err) {
    ElMessage.error('Upstream timeout — retry')
  } finally {
    loading.value = false
  }
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
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
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
.metric { font-size: 28px; font-weight: 700; color: #123a7a; }
.metric.sm { font-size: 20px; }
.label { color: #8090a8; margin-top: 6px; }
</style>
