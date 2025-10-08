const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/services/applicationTrackingService.js',
    replacements: [
      { from: "attributes: ['appliedDate', 'lastUpdated']", to: "attributes: ['applied_date', 'last_updated']" },
      { from: "moment(app.appliedDate), 'days')", to: "moment(app.applied_date), 'days')" },
      { from: "order: [['appliedDate', 'DESC']]", to: "order: [['applied_date', 'DESC']]" },
      { from: "llastUpdated: app.last_updated", to: "lastUpdated: app.last_updated" }
    ]
  },
  {
    file: 'src/services/interviewSchedulingService.js',
    replacements: [
      { from: "scheduledDate: {", to: "scheduled_date: {" },
      { from: "order: [['scheduledDate', 'DESC']]", to: "order: [['scheduled_date', 'DESC']]" }
    ]
  }
];

console.log('🔧 Applying final column name fixes...');

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

console.log('\n🎉 Final column name fixes completed!');
