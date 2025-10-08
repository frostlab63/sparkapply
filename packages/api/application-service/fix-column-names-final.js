const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/services/applicationTrackingService.js',
    replacements: [
      { from: "moment(app.lastUpdated).diff(moment(app.appliedDate), 'days')", to: "moment(app.last_updated).diff(moment(app.applied_date), 'days')" },
      { from: "order: [['appliedDate', 'DESC']]", to: "order: [['applied_date', 'DESC']]" },
      { from: "appliedDate: app.appliedDate", to: "appliedDate: app.applied_date" },
      { from: "lastUpdated: app.lastUpdated", to: "lastUpdated: app.last_updated" }
    ]
  },
  {
    file: 'src/services/interviewSchedulingService.js',
    replacements: [
        { from: "scheduledDate: {", to: "scheduled_date: {" },
        { from: "order: [['scheduledDate', 'ASC']]", to: "order: [['scheduled_date', 'ASC']]" }
    ]
  }
];

console.log('🔧 Applying comprehensive column name fixes...');

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

console.log('\n🎉 Comprehensive column name fixes completed!');
