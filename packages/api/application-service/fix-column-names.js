const fs = require('fs');
const path = require('path');

/**
 * Quick fix script to address column naming inconsistencies
 * This script updates the service files to use the correct database column names
 */

const fixes = [
  {
    file: 'src/services/applicationTrackingService.js',
    replacements: [
      { from: 'appliedDate: {', to: 'applied_date: {' },
      { from: 'appliedDate,', to: 'applied_date,' },
      { from: 'lastUpdated: {', to: 'last_updated: {' },
      { from: 'lastUpdated,', to: 'last_updated,' },
      { from: 'isArchived: archived', to: 'is_archived: archived' },
      { from: 'isArchived: false', to: 'is_archived: false' }
    ]
  },
  {
    file: 'src/services/interviewSchedulingService.js',
    replacements: [
      { from: 'scheduledDate: {', to: 'scheduled_date: {' },
      { from: 'scheduledDate,', to: 'scheduled_date,' },
      { from: 'createdAt: {', to: 'created_at: {' }
    ]
  },
  {
    file: 'src/controllers/enhancedApplicationController.js',
    replacements: [
      { from: 'isArchived: archived', to: 'is_archived: archived' },
      { from: 'isArchived: false', to: 'is_archived: false' },
      { from: 'appliedDate: {', to: 'applied_date: {' },
      { from: 'lastUpdated: {', to: 'last_updated: {' }
    ]
  }
];

console.log('🔧 Applying column name fixes...\n');

fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = 0;
    
    fix.replacements.forEach(replacement => {
      const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replacement.to);
        changesMade += matches.length;
      }
    });
    
    if (changesMade > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${changesMade} issues in ${fix.file}`);
    } else {
      console.log(`ℹ️  No changes needed in ${fix.file}`);
    }
  } catch (error) {
    console.log(`❌ Error fixing ${fix.file}: ${error.message}`);
  }
});

console.log('\n🎉 Column name fixes completed!');
