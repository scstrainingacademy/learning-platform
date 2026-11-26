import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Clock3, Search, Star } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import { addToCart, getCart, subscribeToCart } from '../../../services/cart.js';
import { getWishlist, subscribeToWishlist, toggleWishlist } from '../../../services/wishlist.js';

function CourseCard({ course, enrolled = false, isInCart = false, onAddToCart, onGoToCart, onBuyNow }) {
  const rating = String(course.rating ?? '').trim();
  const hasNumericRating = rating !== '' && Number.isFinite(Number(rating));
  return (
    <article className={`flex overflow-hidden rounded-xl border border-[#e1e4eb] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c9c1ee] hover:shadow-[0_8px_20px_rgba(27,39,58,0.08)] ${enrolled ? 'max-w-[520px] flex-row max-[520px]:flex-col' : 'flex-col'}`}>
      {course.productType === 'mock-interview' && !enrolled ? (
        <div className="aspect-video w-full overflow-hidden bg-slate-50">
          <img
            className="h-full w-full object-cover"
            src={course.image}
            alt=""
            loading="lazy"
            style={{
              objectPosition: `${course.imagePositionX}% ${course.imagePositionY}%`,
              transform: `scale(${course.imageZoom})`,
            }}
          />
        </div>
      ) : (
        <img className={enrolled ? 'h-[150px] w-[160px] shrink-0 object-cover max-[520px]:h-28 max-[520px]:w-full' : 'h-[150px] w-full object-cover'} src={course.image} alt="" loading="lazy" />
      )}
      <div className="flex flex-1 flex-col p-3.5">
        {!enrolled && <div className="flex items-center justify-between gap-3">
          {course.productType === 'mock-interview'
            ? <span className="rounded-full bg-[#f1effb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6048b7]">Interview</span>
            : <>
                <span className="rounded-full bg-[#f1effb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6048b7]">{course.level}</span>
                {hasNumericRating
                  ? <span className="flex items-center gap-1 text-[11px] font-semibold text-[#687789]"><Star size={12} className="fill-amber-400 text-amber-500" /> {rating}</span>
                  : <span className="rounded-full bg-[#fffaf0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c98718]">New</span>}
              </>}
        </div>}
        <h3 className={`${enrolled ? 'mt-1' : 'mt-2.5'} font-[Manrope] text-[15px] font-bold leading-[1.2] text-[#112e49]`}>{enrolled ? 'Continue with your course' : course.title}</h3>
        {!enrolled && (course.productType === 'mock-interview'
          ? <div className="mt-1.5 space-y-0.5 text-xs leading-5 text-[#687789]">
              {course.practiceFor && <p>{course.practiceFor}</p>}
              <p><span className="font-semibold text-[#34495e]">Interviewer:</span> {course.interviewer}</p>
            </div>
          : <p className="mt-1.5 text-xs leading-5 text-[#687789]">{course.description}</p>)}
        {!enrolled && (course.duration || course.hours) && <div className="mt-3 flex gap-4 border-t border-[#edf0f4] pt-3 text-[11px] font-semibold text-[#687789]">
          {course.duration && <span className="flex items-center gap-1"><Clock3 size={13} /> {course.duration}</span>}
          {course.hours && <span className="flex items-center gap-1"><BookOpen size={13} /> {course.hours}</span>}
        </div>}
        {enrolled ? (
          <div className="mt-auto pt-3.5">
            <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-[#687789]"><span>Your progress</span><span>{course.progress}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeef5]"><div className="h-full rounded-full bg-[#6048b7]" style={{ width: `${course.progress}%` }} /></div>
            <a className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-[#6048b7] text-xs font-bold text-white no-underline transition hover:bg-[#49339b]" href="/dashboard">Continue learning <ArrowRight size={14} /></a>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex flex-col">
              <strong className="text-base text-[#122b45]">{course.price}</strong>
              {Number(course.originalPrice) > Number(course.currentPrice) && <span className="text-xs font-medium text-slate-400 line-through">{`₹${Number(course.originalPrice).toLocaleString('en-IN')}`}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {course.cartId?.startsWith('catalog-') || course.cartId?.startsWith('mock-interview-') ? <>
                {course.productType !== 'mock-interview' && <Link className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 no-underline" to={`/learn/${course.cartId}`}>Curriculum</Link>}
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#7A1F2B] px-3 text-xs font-bold text-[#7A1F2B] transition hover:bg-[#7A1F2B] hover:text-white"
                onClick={isInCart ? onGoToCart : onAddToCart}
              >
                {isInCart ? 'Go to cart' : 'Add to cart'}
              </button>
              <button type="button" className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#7A1F2B] px-3 text-xs font-bold text-white transition hover:bg-[#641a25]" onClick={onBuyNow}>Buy now</button>
              </> : <span className="self-center text-xs font-semibold text-slate-500">Enrollment opens soon</span>}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CourseCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-[#e1e4eb] bg-white" aria-hidden="true">
      <div className="h-[150px] animate-pulse bg-[#eef0f4]" />
      <div className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded bg-[#eef0f4]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[#eef0f4]" />
        </div>
        <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-[#eef0f4]" />
        <div className="mt-2 h-3 w-full animate-pulse rounded bg-[#eef0f4]" />
        <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[#eef0f4]" />
        <div className="mt-4 flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-[#eef0f4]" />
          <div className="h-5 w-14 animate-pulse rounded bg-[#eef0f4]" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0f4] pt-3">
          <div className="h-5 w-16 animate-pulse rounded bg-[#eef0f4]" />
          <div className="h-9 w-24 animate-pulse rounded bg-[#eef0f4]" />
        </div>
      </div>
    </article>
  );
}

function CoursesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All levels');
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [mockInterviews, setMockInterviews] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [mockInterviewError, setMockInterviewError] = useState('');
  const [cartCourseIds, setCartCourseIds] = useState([]);
  const [cartError, setCartError] = useState('');
  const [wishlistCourseIds, setWishlistCourseIds] = useState([]);
  const visibleCatalog = useMemo(() => catalogCourses.map((course) => ({
    ...course,
    cartId: `catalog-${course.id}`,
    productType: 'course',
    type: course.category,
    description: `${course.title} - expert-led training for practical, industry-ready skills.`,
    price: `₹${Number(course.price).toLocaleString('en-IN')}`,
    currentPrice: Number(course.price),
    originalPrice: Number(course.oldPrice),
    hours: `${course.lessons} lessons`,
    enrolled: false,
  })), [catalogCourses]);
  const catalogMockInterviews = useMemo(() => mockInterviews.map((interview) => ({
    ...interview,
    cartId: `mock-interview-${interview.id}`,
    productType: 'mock-interview',
    title: interview.type,
    interviewType: interview.type,
    level: '',
    type: 'Mock Interview',
    instructor: interview.interviewer,
    duration: '',
    hours: '',
    price: `₹${Number(interview.price).toLocaleString('en-IN')}`,
    currentPrice: Number(interview.price),
    originalPrice: Number(interview.oldPrice),
    imagePositionX: Number(interview.imagePositionX ?? 50),
    imagePositionY: Number(interview.imagePositionY ?? 50),
    imageZoom: Number(interview.imageZoom ?? 1),
    practiceFor: interview.practiceFor || '',
    description: interview.practiceFor ? `Interview practice for ${interview.practiceFor}.` : '',
    rating: '',
    badge: '',
  })), [mockInterviews]);
  const allCourses = visibleCatalog;
  const enrolledCourses = allCourses.filter((course) => course.enrolled);
  const availableLevels = ['All levels', ...new Set(allCourses.map((course) => course.level))];

  useEffect(() => {
    let active = true;
    fetch('/api/courses')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Course catalog could not be loaded.');
        if (!Array.isArray(data)) throw new Error('The course catalog response was invalid.');
        return data;
      })
      .then((data) => {
        if (!active) return;
        setCatalogCourses(data);
        setCatalogLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setCatalogError(error.message);
        setCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/mock-interviews')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Mock interviews could not be loaded.');
        if (!Array.isArray(data)) throw new Error('The mock interview response was invalid.');
        return data;
      })
      .then((data) => {
        if (active) setMockInterviews(data);
      })
      .catch((error) => {
        if (active) setMockInterviewError(error.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const updateCart = (cart) => setCartCourseIds(cart.map((item) => item.id));
    try {
      updateCart(getCart());
    } catch (error) {
      setCartError(error.message);
    }
    return subscribeToCart(updateCart);
  }, []);

  useEffect(() => {
    const updateWishlist = (wishlist) => setWishlistCourseIds(wishlist.map((item) => item.id));
    try {
      updateWishlist(getWishlist());
    } catch (error) {
      setCartError(error.message);
    }
    return subscribeToWishlist(updateWishlist);
  }, []);

  const addCourseToCart = (course) => {
    try {
      addToCart(course);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const buyCourseNow = (course) => {
    try {
      addToCart(course);
      navigate('/checkout');
    } catch (error) {
      window.alert(error.message);
    }
  };

  const toggleCourseWishlist = (course) => {
    try {
      toggleWishlist(course);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allCourses.filter((course) => {
      const matchesQuery = !normalizedQuery || `${course.title} ${course.level} ${course.description}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (level === 'All levels' || course.level === level);
    });
  }, [allCourses, level, query]);
  const filteredMockInterviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return catalogMockInterviews.filter((interview) => (
      !normalizedQuery
      || `${interview.interviewType} ${interview.interviewer}`.toLowerCase().includes(normalizedQuery)
    ));
  }, [catalogMockInterviews, query]);

  const courseSections = [{ title: 'All courses', items: visibleCourses }];

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#12243a]">
      <Navbar />
      <main className="customer-page-container pb-10">
        {(cartError || catalogError || mockInterviewError) && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{cartError || catalogError || mockInterviewError}</p>}
        <section className="border-b border-[#edf0f4] py-7 sm:py-9">
          <div className="mt-2.5 flex flex-wrap items-start justify-between gap-4">
            <div><h1 className="customer-page-title text-[#112e49]">Empower Your Future with Industry-Ready Skills.</h1><p className="customer-page-lead mb-0 max-w-2xl text-[#687789]">Explore expert-led courses designed to build real-world skills, enhance your knowledge, and accelerate your career growth.</p></div>
            <label className="mt-2 flex h-10 w-full max-w-[300px] items-center gap-2.5 rounded-md border border-[#dfe3ea] px-3 shadow-sm focus-within:border-[#6048b7]"><Search size={16} className="text-[#8290a0]" /><span className="sr-only">Search courses</span><input className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#9aa4b1]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses" /></label>
          </div>
        </section>

        <section className="py-7" aria-labelledby="my-course-title">
          <div className="mb-6 flex items-end justify-between gap-4"><div><h2 id="my-course-title" className="m-0 font-['DM_Sans',_sans-serif] text-[32px] font-bold leading-tight tracking-[-.035em] text-[#182b49]">Continue Your learning...</h2></div></div>
          <div className="grid max-w-[520px] gap-4">{enrolledCourses.map((course) => <CourseCard key={course.title} course={course} enrolled />)}</div>
        </section>

        <section className="pt-7" aria-labelledby="all-courses-title">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><h2 id="all-courses-title" className="customer-page-section-title text-[#182b49]">More courses for you</h2></div>
            <select className="h-9 rounded-md border border-[#dfe3ea] bg-white px-2.5 text-xs text-[#34495e] outline-none focus:border-[#6048b7]" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by course level">{availableLevels.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="mt-6 space-y-8">
            {courseSections.map((section) => (
              <section key={section.title} aria-labelledby={`${section.title}-title`}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 id={`${section.title}-title`} className="m-0 font-[Manrope] text-base font-bold text-[#112e49]">{section.title}</h3>
                </div>
                {catalogLoading ? (
                  <div className="grid max-w-[960px] gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Loading courses">
                    {[0, 1, 2].map((skeleton) => <CourseCardSkeleton key={skeleton} />)}
                  </div>
                ) : catalogError ? null : section.items.length > 0 ? (
                  <div className="grid max-w-[960px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((course) => (
                      <CourseCard
                        key={`${section.title}-${course.cartId}`}
                        course={course}
                        isInCart={cartCourseIds.includes(course.cartId)}
                        isWishlisted={wishlistCourseIds.includes(course.cartId)}
                        onToggleWishlist={() => toggleCourseWishlist(course)}
                        onAddToCart={() => addCourseToCart(course)}
                        onGoToCart={() => navigate('/cart')}
                        onBuyNow={() => buyCourseNow(course)}
                      />
                    ))}
                  </div>
                ) : allCourses.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-[#f1dfb3] bg-[#fff9e9] px-3 py-2.5 text-xs font-medium text-[#88651d]" role="status">
                    <AlertCircle size={15} className="shrink-0 text-[#d99b22]" />
                    <span>New courses are coming soon. Stay tuned!</span>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="mx-auto text-[#6048b7]" />
                    <h3 className="mt-2 font-[Manrope] text-base font-bold text-[#112e49]">No courses found</h3>
                    <p className="mt-1 text-xs text-[#687789]">Try a different search or filter.</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>

        {filteredMockInterviews.length > 0 && (
          <section className="mt-10 border-t border-[#edf0f4] pt-8" aria-labelledby="mock-interviews-title">
            <div className="mb-5 flex items-center gap-3">
              <h2 id="mock-interviews-title" className="m-0 font-[Manrope] text-2xl font-bold leading-tight tracking-[-.025em] text-[#182b49]">Mock interview practice</h2>
            </div>
            <div className="grid max-w-[960px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMockInterviews.map((interview) => (
                <CourseCard
                  key={interview.cartId}
                  course={interview}
                  isInCart={cartCourseIds.includes(interview.cartId)}
                  onAddToCart={() => addCourseToCart(interview)}
                  onGoToCart={() => navigate('/cart')}
                  onBuyNow={() => buyCourseNow(interview)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default CoursesPage;
