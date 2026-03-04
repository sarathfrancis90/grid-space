#!/bin/bash
#
# update-kanban.sh — Move an issue between GitHub Projects v2 Kanban columns
#
# Usage: ./update-kanban.sh --issue 42 --status "In Progress"
# Requires: GH_TOKEN with project scope (set via environment)
#
# Supported statuses: Backlog, Ready, In Progress, In Review, Done
#

set -euo pipefail

ISSUE_NUMBER=""
TARGET_STATUS=""

# Parse repo info from GitHub Actions environment or defaults
REPO_FULL="${GITHUB_REPOSITORY:-sarathfrancis90/grid-space}"
REPO_OWNER="${REPO_FULL%%/*}"
REPO_NAME="${REPO_FULL##*/}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --issue) ISSUE_NUMBER="$2"; shift 2 ;;
    --status) TARGET_STATUS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$ISSUE_NUMBER" || -z "$TARGET_STATUS" ]]; then
  echo "Usage: $0 --issue <number> --status <Backlog|Ready|In Progress|In Review|Done>"
  exit 1
fi

echo "Updating issue #${ISSUE_NUMBER} to status: ${TARGET_STATUS}"

# Step 1: Get the issue node ID
ISSUE_NODE_ID=$(gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        id
      }
    }
  }' -f owner="$REPO_OWNER" -f repo="$REPO_NAME" -F number="$ISSUE_NUMBER" \
  --jq '.data.repository.issue.id')

if [[ -z "$ISSUE_NODE_ID" || "$ISSUE_NODE_ID" == "null" ]]; then
  echo "Error: Could not find issue #${ISSUE_NUMBER}"
  exit 1
fi

echo "Found issue node ID: ${ISSUE_NODE_ID}"

# Step 2: Get project info (first project linked to the repo)
PROJECT_DATA=$(gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      projectsV2(first: 1) {
        nodes {
          id
          fields(first: 30) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }' -f owner="$REPO_OWNER" -f repo="$REPO_NAME")

PROJECT_ID=$(echo "$PROJECT_DATA" | jq -r '.data.repository.projectsV2.nodes[0].id')

if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "null" ]]; then
  echo "Error: No project found for ${REPO_OWNER}/${REPO_NAME}"
  exit 1
fi

echo "Found project ID: ${PROJECT_ID}"

# Step 3: Find the Status field and the target option ID
STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '
  .data.repository.projectsV2.nodes[0].fields.nodes[]
  | select(.name == "Status")
  | .id')

if [[ -z "$STATUS_FIELD_ID" || "$STATUS_FIELD_ID" == "null" ]]; then
  echo "Error: Could not find 'Status' field in project"
  exit 1
fi

TARGET_OPTION_ID=$(echo "$PROJECT_DATA" | jq -r --arg status "$TARGET_STATUS" '
  .data.repository.projectsV2.nodes[0].fields.nodes[]
  | select(.name == "Status")
  | .options[]
  | select(.name == $status)
  | .id')

if [[ -z "$TARGET_OPTION_ID" || "$TARGET_OPTION_ID" == "null" ]]; then
  echo "Error: Status '${TARGET_STATUS}' not found. Available statuses:"
  echo "$PROJECT_DATA" | jq -r '
    .data.repository.projectsV2.nodes[0].fields.nodes[]
    | select(.name == "Status")
    | .options[].name'
  exit 1
fi

echo "Status field ID: ${STATUS_FIELD_ID}, Target option ID: ${TARGET_OPTION_ID}"

# Step 4: Find the project item for this issue (or add it if not present)
ITEM_ID=$(gh api graphql -f query='
  query($projectId: ID!, $cursor: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: 100, after: $cursor) {
          nodes {
            id
            content {
              ... on Issue {
                number
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }' -f projectId="$PROJECT_ID" \
  --jq ".data.node.items.nodes[] | select(.content.number == ${ISSUE_NUMBER}) | .id")

if [[ -z "$ITEM_ID" || "$ITEM_ID" == "null" ]]; then
  echo "Issue not in project yet, adding it..."
  ITEM_ID=$(gh api graphql -f query='
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }' -f projectId="$PROJECT_ID" -f contentId="$ISSUE_NODE_ID" \
    --jq '.data.addProjectV2ItemById.item.id')

  if [[ -z "$ITEM_ID" || "$ITEM_ID" == "null" ]]; then
    echo "Error: Failed to add issue to project"
    exit 1
  fi
  echo "Added issue to project, item ID: ${ITEM_ID}"
else
  echo "Found project item ID: ${ITEM_ID}"
fi

# Step 5: Update the status
gh api graphql -f query='
  mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item {
        id
      }
    }
  }' -f projectId="$PROJECT_ID" -f itemId="$ITEM_ID" -f fieldId="$STATUS_FIELD_ID" -f optionId="$TARGET_OPTION_ID" > /dev/null

echo "Successfully updated issue #${ISSUE_NUMBER} to '${TARGET_STATUS}'"
