# -*- coding: utf-8 -*-
"""Turns subchapter 1.6 of the report into a standalone SRS document:
chapters 1-6, tables and figures renumbered per chapter, references to other parts of the report rewritten."""
import re
import content as C
import srs_block

TITLE = "SOFTWARE REQUIREMENTS SPECIFICATION"

EXTERNAL = [
    ("the analysis in subchapters 1.1–1.5: the problems from Table 1.2, the needs of the personas and the value proposition",
     "the field analysis carried out for the project: the problems of the current trade process, the needs of the target users and the value proposition of the platform"),
    ("from the three key problems in Table 1.10 and from the value proposition",
     "from the three key problems identified in the field analysis (finding a reliable partner, recording stock and agreements, communication around an order) and from the value proposition"),
    ("as established in subchapter 1.2", "as established in the problem analysis of the project"),
    ("correspond to the two primary segments from Table 1.7", "correspond to the two primary target segments, producers and wholesale buyers"),
    ("closes the loop of trust described in subchapter 1.5", "closes the loop of trust on which the value proposition of the platform is built"),
    ("(segment S1)", "(primary segment)"), ("(segment S2)", "(primary segment)"), ("(segment S3)", "(secondary segment)"),
    ("paragraph 1.6.3", "Chapter 4"),
    ("in Chapter 2", "in the UML modelling chapter of the project report"),
    ("in Chapter 3", "in the implementation chapter of the project report"),
]

INTRO_FIRST = ("This document specifies the software requirements of AgroHub, a B2B web platform for wholesale order "
               "management and optimisation of agricultural product distribution flows, developed as a bachelor's project at "
               "the Technical University of Moldova. It states what the system must do and how well it must do it, in a form "
               "that can later be modelled, implemented and tested. It follows the structure recommended by the ISO/IEC/IEEE "
               "29148 standard for requirements engineering, which treats a software requirements specification (SRS) as the "
               "agreed description of the system that both the client and the developer rely on [@ieee29148].")

STRUCTURE = ("The document is organised as follows. Chapter 2 presents the informal requirements, their clarification, the "
             "goals, the constraints and the key user flows. Chapter 3 gives the general description of the system together "
             "with its actors and roles. Chapter 4 lists the functional requirements, and Chapter 5 the use cases and the "
             "user stories. The non-functional requirements are specified in Chapter 6, delivered as a separate section "
             "that is appended to this document.")


def build_blocks():
    src = list(srs_block.SRS)
    out = [('h1', "1 INTRODUCTION")]
    i = 1  # skip the h2 of subchapter 1.6
    first = True
    while src[i][0] != 'h3':
        b = src[i]
        if first:
            b = ('p', INTRO_FIRST); first = False
        out.append(b); i += 1
    out.append(('p', STRUCTURE))
    chapter = 1
    for b in src[i:]:
        if b[0] == 'h3' and b[1].startswith('1.6.5'):
            break  # the non-functional requirements form a separate section (build_nfr_blocks)
        if b[0] == 'h3':
            chapter += 1
            out.append(('h1', "%d %s" % (chapter, re.sub(r'^1\.6\.\d+\s+', '', b[1]).upper())))
        else:
            out.append((b, chapter))
    # renumber tables and figures per chapter
    mapping, counters = {}, {}
    for item in out:
        if isinstance(item, tuple) and len(item) == 2 and isinstance(item[0], tuple):
            b, ch = item
            if b[0] in ('table', 'fig'):
                cap = b[1] if b[0] == 'table' else b[2]
                if cap:
                    kind = 'Table' if b[0] == 'table' else 'Figure'
                    old = re.match(r'(Table|Figure) (1\.\d+)', cap).group(2)
                    counters[(kind, ch)] = counters.get((kind, ch), 0) + 1
                    mapping[(kind, old)] = '%d.%d' % (ch, counters[(kind, ch)])
    def fix(x):
        if isinstance(x, str):
            for a, c in EXTERNAL:
                x = x.replace(a, c)
            x = re.sub(r'\b(Table|Figure) (1\.\d+)\b', lambda m: '%s %s' % (m.group(1), mapping.get((m.group(1), m.group(2)), m.group(2))), x)
            x = re.sub(r'\b(Tables) (1\.\d+)', lambda m: m.group(0), x)
            return x
        if isinstance(x, tuple):
            return tuple(fix(y) for y in x)
        if isinstance(x, list):
            return [fix(y) for y in x]
        return x
    blocks = [fix(item[0] if (isinstance(item, tuple) and len(item) == 2 and isinstance(item[0], tuple)) else item) for item in out]
    leftovers = [m for b in blocks for m in re.findall(r'(?:subchapters?|paragraph) 1\.\d|Table 1\.\d+|Figure 1\.\d+|Chapter [23]\b', str(b))]
    if leftovers:
        print('warning: unresolved references:', sorted(set(leftovers)))
    return blocks


NFR_INTRO = ("This section completes the software requirements specification of the AgroHub platform with its "
             "non-functional requirements. Chapters 1–5 of the specification describe what the system does; this chapter "
             "describes how well it must do it and how each quality is verified.")


def build_nfr_blocks():
    blocks = [('h1', "6 NON-FUNCTIONAL REQUIREMENTS"), ('p', NFR_INTRO)]
    blocks += srs_block._renumber(srs_block.NFR_RAW, {'Table NFR_A': 'Table 6.1', 'Table NFR_B': 'Table 6.2'})
    blocks = srs_block._renumber(blocks, {"The flows F1–F3": "The key user flows F1–F3 (Chapter 2)"})
    return blocks
