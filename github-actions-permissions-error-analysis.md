# GitHub Actions Permission Error: "Resource not accessible by integration"

## Executive Summary

The error "Resource not accessible by integration" with HTTP status 403 is a common GitHub Actions permission issue that occurs when the `GITHUB_TOKEN` lacks sufficient permissions to perform the requested operation. This typically happens when workflows try to create issue comments, manage pull requests, or perform write operations without proper permissions.

## Root Cause Analysis

### What's Happening
Your GitHub Actions workflow using `actions/github-script@v7` is attempting to create an issue comment on repository `you112ef/77777` but failing with a 403 error. The request is trying to POST to:
```
https://api.github.com/repos/you112ef/77777/issues/1/comments
```

### Why It's Failing
The `GITHUB_TOKEN` being used doesn't have the necessary `issues: write` permission to create issue comments. The error headers show that `issues=write` permissions are required but not granted.

## Understanding GitHub Actions Permissions

### How GITHUB_TOKEN Works
- **Auto-generated**: GitHub automatically creates a unique `GITHUB_TOKEN` for each workflow job
- **Scoped**: Limited to the repository containing the workflow
- **Temporary**: Expires when the job finishes or after 24 hours
- **App-based**: Actually a GitHub App installation access token

### Default Permission Models
GitHub repositories can use two permission models:

1. **Permissive (Legacy)**: Read/write access to most resources
2. **Restrictive (Recommended)**: Read-only access by default

## Solutions

### Solution 1: Add Explicit Permissions to Workflow (Recommended)

Add permissions at the workflow level:

```yaml
name: "Your Workflow"
on: [push]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  your-job:
    runs-on: ubuntu-latest
    steps:
      - name: Comment on Issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Your comment here'
            })
```

### Solution 2: Add Permissions at Job Level

For more granular control:

```yaml
name: "Your Workflow"
on: [push]

jobs:
  build-and-comment:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - name: Comment on Issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: 1,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📱 APK Build Complete
              
              | File | Size | Download |
              |------|------|----------|
              | Debug APK | 6276364 bytes | [Download](${context.payload.repository.html_url}/actions/runs/${context.runId}) |
              | Release APK | 5050533 bytes | [Download](${context.payload.repository.html_url}/actions/runs/${context.runId}) |
              
              **Build Info:**
              - Commit: \`${context.sha}\`
              - Build: #${context.runNumber}
              - Date: ${new Date().toISOString()}
              `
            })
```

### Solution 3: Repository Settings Configuration

Navigate to your repository settings:
1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select:
   - **Read and write permissions** (for permissive access)
   - Or keep **Read repository contents and packages permissions** and use explicit permissions in workflows

### Solution 4: Organization-Level Settings

For enterprise/organization accounts:
1. Go to Organization **Settings** → **Actions** → **General**
2. Configure default permissions for all repositories
3. This affects all repositories in the organization

## Permission Reference Guide

### Required Permissions by Action Type

| Action | Required Permission | Scope |
|--------|-------------------|-------|
| Create issue comment | `issues: write` | Repository |
| Create PR comment | `pull-requests: write` | Repository |
| Push to repository | `contents: write` | Repository |
| Create release | `contents: write` | Repository |
| Manage packages | `packages: write` | Repository |
| Manage deployments | `deployments: write` | Repository |
| Update status checks | `statuses: write` | Repository |

### Complete Permission Options

```yaml
permissions:
  actions: read|write|none
  attestations: read|write|none
  checks: read|write|none
  contents: read|write|none
  deployments: read|write|none
  discussions: read|write|none
  id-token: write|none
  issues: read|write|none
  packages: read|write|none
  pages: read|write|none
  pull-requests: read|write|none
  security-events: read|write|none
  statuses: read|write|none
```

## Advanced Solutions

### For Cross-Repository Access

If you need to access different repositories, you'll need a Personal Access Token (PAT) or GitHub App:

```yaml
jobs:
  cross-repo-access:
    runs-on: ubuntu-latest
    steps:
      - name: Access Another Repo
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          script: |
            // Access different repository
            await github.rest.issues.createComment({
              owner: 'different-owner',
              repo: 'different-repo',
              issue_number: 1,
              body: 'Comment from external workflow'
            })
```

### Using GitHub App for Enhanced Security

1. Create a GitHub App with required permissions
2. Install the app on target repositories
3. Use `actions/create-github-app-token` action:

```yaml
jobs:
  github-app-access:
    runs-on: ubuntu-latest
    steps:
      - name: Generate token
        id: generate_token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
      
      - name: Use the token
        uses: actions/github-script@v7
        with:
          github-token: ${{ steps.generate_token.outputs.token }}
          script: |
            // Your script here
```

## Best Practices

### Security Recommendations

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Explicit Permissions**: Always define permissions explicitly in workflows
3. **Job-Level Permissions**: Use job-level permissions for granular control
4. **Regular Audits**: Review and update permissions regularly

### Example: Secure APK Build Workflow

```yaml
name: APK Build and Comment
on: [push]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Build APK
        run: |
          # Your build commands here
          echo "Building APK..."
  
  comment:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - name: Comment on Issue
        uses: actions/github-script@v7
        with:
          script: |
            const comment = `## 📱 APK Build Complete
            
            **Build Status**: ✅ Success
            **Commit**: \`${context.sha.substring(0, 7)}\`
            **Workflow**: [${context.workflow}](${context.payload.repository.html_url}/actions/runs/${context.runId})
            `;
            
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Troubleshooting Steps

### 1. Check Current Permissions
Look at the workflow run logs under "Set up job" to see actual permissions granted.

### 2. Verify Repository Settings
Ensure repository allows the required actions in Settings → Actions.

### 3. Test with Minimal Permissions
Start with broad permissions and narrow down to identify the minimum required.

### 4. Check for Forked Repository Limitations
Forked repositories have additional restrictions on write permissions.

## Common Pitfalls

1. **Missing Permissions**: Not specifying required permissions explicitly
2. **Wrong Scope**: Using workflow-level permissions when job-level is needed
3. **Fork Restrictions**: Attempting write operations from forked repositories
4. **Token Confusion**: Mixing up `GITHUB_TOKEN` with other token types

## Quick Fix for Your Specific Error

Based on your error, add this to your workflow file:

```yaml
name: Your Workflow Name
on: [push]

permissions:
  contents: read
  issues: write

jobs:
  your-job-name:
    runs-on: ubuntu-latest
    steps:
      # Your existing steps
      - name: Comment on Issue
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              issue_number: 1,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📱 APK Build Complete

| File | Size | Download |
|------|------|----------|
| Debug APK | 6276364 bytes | [Download](https://github.com/you112ef/77777/actions/runs/${context.runId}) |
| Release APK | 5050533 bytes | [Download](https://github.com/you112ef/77777/actions/runs/${context.runId}) |

**Build Info:**
- Commit: \`${context.sha}\`
- Build: #${context.runNumber}
- Date: ${new Date().toISOString()}
`
            });
```

## Conclusion

The "Resource not accessible by integration" error is primarily a permissions issue that can be resolved by:

1. Adding explicit permissions to your workflow
2. Configuring repository settings appropriately
3. Following security best practices
4. Understanding the scope and limitations of `GITHUB_TOKEN`

For your specific APK build workflow, adding `issues: write` permission should resolve the immediate issue. Always follow the principle of least privilege and grant only the minimum permissions required for your workflow to function.