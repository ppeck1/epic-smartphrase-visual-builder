/*
 * Module: block-library
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- built-in starter blocks ----------
  const BUILTIN_MODULES = [
    {id: "free-text", kind: "free-text", evidence: "exact", label: "Text", description: "Words you write. They copy exactly.", category: "Basics", subCategory: "Text and blanks", token: ""},
    {id: "wildcard", kind: "wildcard", evidence: "exact", label: "Wildcard", description: "Three stars. Fill them in while writing the note.", category: "Basics", subCategory: "Text and blanks", token: "***"},
    {id: "personal-placeholder", kind: "smartlink", evidence: "creation", label: "Your-name placeholder", description: "Replace this with your approved name. Never use patient information.", category: "Basics", subCategory: "Text and blanks", token: "[INSERT YOUR NAME]", source: "Name placeholder"},
    {id: "custom-smartlist", kind: "custom-smartlist", evidence: "creation", label: "New SmartList", description: "Write the choices here. Build the working list in Epic.", category: "Basics", subCategory: "Make a SmartList", token: ""},
    {id: "nested-smartphrase", kind: "smartlink", evidence: "observed", label: "Another SmartPhrase (@@)", description: "Add another saved SmartPhrase with Epic's @@ tool.", category: "Basics", subCategory: "Add another phrase", token: "@@", source: "Epic @@ tool"},

    link("@NAME@", "Patient full name", "Patient identifiers", "observed"),
    link("@FNAME@", "Patient first name", "Patient identifiers", "observed"),
    link("@LNAME@", "Patient last name", "Patient identifiers", "observed"),
    link("@DOB@", "Date of birth", "Patient identifiers", "observed"),
    link("@AGE@", "Patient age", "Patient identifiers", "observed"),
    link("@SEX@", "Sex / gender", "Patient identifiers", "observed"),
    link("@MRN@", "Medical record number", "Patient identifiers", "observed"),
    link("@PRONOUN@", "Patient pronouns", "Patient identifiers", "observed"),

    link("@TD@", "Today's date", "Encounter & author", "observed"),
    link("@NOW@", "Current date and time", "Encounter & author", "observed"),
    link("@ME@", "Current user (your name)", "Encounter & author", "observed"),
    link("@MYNAME@", "Logged-in user name", "Encounter & author", "observed"),
    link("@DOS@", "Date of service", "Encounter & author", "observed"),
    link("@DEPT@", "Department / clinic", "Encounter & author", "observed"),
    link("@LOS@", "Length of stay (days)", "Encounter & author", "observed"),
    link("@PCP@", "Primary care provider", "Encounter & author", "observed"),

    link("@DIAG@", "Encounter diagnoses", "Clinical data", "observed"),
    link("@PROB@", "Problem list", "Clinical data", "observed"),
    link("@CMED@", "Current medications", "Clinical data", "observed"),
    link("@ALG@", "Allergies", "Clinical data", "observed"),
    link("@VS@", "Vital signs", "Clinical data", "observed"),
    link("@VSRANGES@", "Vital-sign ranges (last 24h)", "Clinical data", "observed"),
    link("@LABRECENT@", "Recent lab results", "Clinical data", "observed"),
    link("@RESULTS@", "Results (labs/studies)", "Clinical data", "observed"),
    link("@IMPPLAN@", "Assessment and plan", "Clinical data", "observed"),
    link("@PMH@", "Past medical history", "Clinical data", "observed"),
    link("@PSH@", "Past surgical history", "Clinical data", "observed"),
    link("@FH@", "Family history", "Clinical data", "observed"),
    link("@SH@", "Social history", "Clinical data", "observed"),
    link("@ROS@", "Review of systems", "Clinical data", "observed"),
    link("@PE@", "Physical exam", "Clinical data", "observed")
  ];
  function link(token, label, subCategory, evidence) {
    return {id: `builtin-link-${slug(token)}`, kind: "smartlink", evidence, label, token, description: `Pulls ${label.toLowerCase()} from Epic. Check that it works in your Epic.`, category: "SmartLinks", subCategory, source: "Starter list"};
  }

  let phraseBank = null;
  let objectBank = null;
  let bankFileName = "";

  function buildModuleLibrary() {
    const modules = BUILTIN_MODULES.map((item) => ({...item}));
    const seenLinks = new Set(modules.filter((m) => m.kind === "smartlink" && m.token && /^@.*@$/.test(m.token)).map((m) => m.token.toUpperCase()));
    const seenLists = new Set();
    if (phraseBank && Array.isArray(phraseBank.entries)) {
      phraseBank.entries.forEach((entry) => {
        const body = String(entry.body || "");
        for (const t of body.match(/@[A-Za-z0-9_().,:=-]+@/g) || []) {
          if (seenLinks.has(t.toUpperCase())) continue;
          seenLinks.add(t.toUpperCase());
          modules.push({id: `observed-link-${slug(t)}`, kind: "smartlink", evidence: "observed", label: t, token: t, description: "Found in your library. Check it in Epic.", category: "Your library · SmartLinks", subCategory: "Added library", source: `Found in ${entry.displayIdentifier || entry.identifier || "your library"}`});
        }
        for (const t of extractObservedSmartListTokens(body)) {
          if (seenLists.has(t.toLowerCase())) continue;
          seenLists.add(t.toLowerCase());
          modules.push({id: `observed-list-${slug(t)}`, kind: "existing-smartlist", evidence: "observed", label: t.replace(/[{}]/g, "").split(":")[0], token: t, description: "Found in your library. Check its choices in Epic.", category: "Your library · SmartLists", subCategory: "Added library", source: `Found in ${entry.displayIdentifier || entry.identifier || "your library"}`});
        }
        if (body.trim()) {
          modules.push({id: `template-${entry.id || slug(entry.identifier || entry.displayIdentifier || Math.random())}`, kind: "template", evidence: "observed", label: entry.displayIdentifier || entry.identifier || "Template", body, description: "Template from your library. Check it before use.", category: "Your library · Templates", subCategory: entry.practice || "General", source: `Pages ${(entry.sourcePages || []).join(", ") || "not listed"}`, sourcePages: entry.sourcePages || [], specialty: entry.practice || "", privacyNotice: entry.privacyNotice || "No patient information belongs in this draft.", requirementStatus: entry.requirementStatus || "Not listed"});
        }
      });
    }
    if (objectBank && Array.isArray(objectBank.entries)) {
      objectBank.entries.filter((entry) => ["SmartLink", "SmartLists"].includes(entry.objectType)).forEach((entry) => {
        const isLink = entry.objectType === "SmartLink";
        modules.push({id: `catalog-${entry.id || slug(entry.name)}`, kind: isLink ? "catalog-smartlink" : "catalog-smartlist", evidence: "catalog", label: entry.name, token: `[[INSERT ${isLink ? "SMARTLINK" : "SMARTLIST"} IN EPIC: ${entry.name}]]`, description: "From your library. Add it with Epic's insert tool.", category: isLink ? "Your library · SmartLinks" : "Your library · SmartLists", subCategory: entry.alphabetGroup || "Added library", source: "Added library"});
      });
    }
    return modules.map((item) => ({...item, searchText: `${item.label} ${item.token || ""} ${item.description} ${item.category} ${item.subCategory} ${item.source || ""}`.toLowerCase()}));
  }
